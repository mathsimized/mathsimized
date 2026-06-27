from flask import Flask, request, jsonify, Response, stream_with_context, send_from_directory
from flask_cors import CORS
import requests
import json
import os
import base64
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder=None)
CORS(app)

PARENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@app.route('/', methods=['GET'])
@app.route('/<path:filename>', methods=['GET'])
def serve_static(filename='index.html'):
    if not filename:
        filename = 'index.html'
    filepath = os.path.join(PARENT_DIR, filename)
    if os.path.isfile(filepath):
        return send_from_directory(PARENT_DIR, filename)
    return send_from_directory(PARENT_DIR, 'index.html')

OLLAMA_BASE = os.getenv('OLLAMA_BASE', 'http://localhost:11434')

SYSTEM_PROMPT = """You are StudyPal, an AI math tutor for MATHSIMIZED. You help students understand mathematics concepts — from O Level to Further Maths. Be clear, step-by-step, and encouraging. Use simple language. When explaining, break problems into small steps. You can read images and documents.

When the user asks you to DRAW or SHOW a graph, respond with the expression wrapped in [GRAPH] tags like this: [GRAPH]x^2+2x+3[/GRAPH]. The system will automatically render the graph image. Only use [GRAPH] when explicitly asked for a visual graph — do not use it when explaining graph theory or steps."""


@app.route('/api/health')
def health():
    try:
        r = requests.get(f'{OLLAMA_BASE}/api/tags', timeout=3)
        return jsonify({'status': 'ok', 'ollama': True})
    except:
        return jsonify({'status': 'ok', 'ollama': False})


@app.route('/api/models')
def list_models():
    try:
        r = requests.get(f'{OLLAMA_BASE}/api/tags', timeout=5)
        if r.status_code == 200:
            models = r.json().get('models', [])
            out = []
            for m in models:
                name = m['name']
                is_vision = any(v in name for v in ['llava', 'moondream', 'bakllava', 'llama3.2-vision'])
                out.append({'name': name, 'size': m['size'], 'vision': is_vision})
            return jsonify({'models': out})
        return jsonify({'models': []})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '').strip()
    model = data.get('model', 'qwen2.5:1.5b')
    history = data.get('history', [])

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}] + history + [{'role': 'user', 'content': message}]

    def generate():
        try:
            r = requests.post(
                f'{OLLAMA_BASE}/api/chat',
                json={'model': model, 'messages': messages, 'stream': True, 'options': {'num_predict': 2048}},
                stream=True, timeout=60
            )
            for line in r.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        if 'message' in chunk and 'content' in chunk['message']:
                            yield f'data: {json.dumps({"content": chunk["message"]["content"]})}\n\n'
                        if chunk.get('done'):
                            stats = {k: chunk[k] for k in ['total_duration', 'load_duration', 'prompt_eval_count', 'eval_count', 'eval_duration'] if k in chunk}
                            yield f'data: {json.dumps({"done": True, "stats": stats})}\n\n'
                    except json.JSONDecodeError:
                        continue
        except requests.exceptions.Timeout:
            yield f'data: {json.dumps({"error": "Request timed out. The model may still be loading."})}\n\n'
        except ConnectionRefusedError:
            yield f'data: {json.dumps({"error": "Cannot connect to Ollama. Make sure it is running (ollama serve)."})}\n\n'
        except Exception as e:
            yield f'data: {json.dumps({"error": str(e)})}\n\n'

    return Response(stream_with_context(generate()), mimetype='text/event-stream')


@app.route('/api/chat-with-image', methods=['POST'])
def chat_with_image():
    data = request.json
    message = data.get('message', '').strip()
    image_base64 = data.get('image', '')
    model = data.get('model', 'llava:7b')
    history = data.get('history', [])

    if not image_base64:
        return jsonify({'error': 'Image data is required'}), 400

    user_content = {'role': 'user', 'content': message or 'Describe this image.', 'images': [image_base64]}
    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}] + history + [user_content]

    def generate():
        try:
            r = requests.post(
                f'{OLLAMA_BASE}/api/chat',
                json={'model': model, 'messages': messages, 'stream': True, 'options': {'num_predict': 2048}},
                stream=True, timeout=120
            )
            for line in r.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        if 'message' in chunk and 'content' in chunk['message']:
                            yield f'data: {json.dumps({"content": chunk["message"]["content"]})}\n\n'
                        if chunk.get('done'):
                            yield f'data: {json.dumps({"done": True})}\n\n'
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            yield f'data: {json.dumps({"error": str(e)})}\n\n'

    return Response(stream_with_context(generate()), mimetype='text/event-stream')


@app.route('/api/chat-with-document', methods=['POST'])
def chat_with_document():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    message = request.form.get('message', '').strip()
    model = request.form.get('model', 'qwen2.5:1.5b')
    history_json = request.form.get('history', '[]')
    history = json.loads(history_json)

    text_content = ''
    filename = file.filename or 'document'

    if filename.lower().endswith('.pdf'):
        try:
            import PyPDF2
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text_content += page.extract_text() or '' + '\n'
        except ImportError:
            text_content = '[PDF parsing requires PyPDF2. Install with: pip install PyPDF2]'
    else:
        try:
            text_content = file.read().decode('utf-8', errors='replace')
        except:
            text_content = '[Could not read file as text]'

    if len(text_content) > 15000:
        text_content = text_content[:15000] + '\n... [content truncated at 15000 chars]'

    full_prompt = f"I've uploaded a document named '{filename}' with the following content:\n\n---\n{text_content}\n---\n\nMy question: {message or 'Please summarize this document.'}"

    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}] + history + [{'role': 'user', 'content': full_prompt}]

    def generate():
        try:
            r = requests.post(
                f'{OLLAMA_BASE}/api/chat',
                json={'model': model, 'messages': messages, 'stream': True, 'options': {'num_predict': 2048}},
                stream=True, timeout=120
            )
            for line in r.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        if 'message' in chunk and 'content' in chunk['message']:
                            yield f'data: {json.dumps({"content": chunk["message"]["content"]})}\n\n'
                        if chunk.get('done'):
                            yield f'data: {json.dumps({"done": True})}\n\n'
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            yield f'data: {json.dumps({"error": str(e)})}\n\n'

    return Response(stream_with_context(generate()), mimetype='text/event-stream')


@app.route('/api/generate-graph', methods=['POST'])
def generate_graph():
    data = request.json
    expression = data.get('expression', '').strip()

    if not expression:
        return jsonify({'error': 'Expression is required'}), 400

    try:
        import urllib.parse

        import re
        sanitized = expression.replace('^', '**')
        sanitized = re.sub(r'(\d)([a-zA-Z(])', r'\1*\2', sanitized)
        sanitized = re.sub(r'([a-zA-Z)])(\d)', r'\1*\2', sanitized)

        xs = [i * 0.1 for i in range(-50, 51)]
        pts = []
        for x in xs:
            try:
                y = eval(sanitized, {'__builtins__': {}}, {'x': x, 'sin': __import__('math').sin, 'cos': __import__('math').cos, 'tan': __import__('math').tan, 'sqrt': __import__('math').sqrt, 'log': __import__('math').log, 'abs': abs, 'pi': __import__('math').pi, 'e': __import__('math').e})
                if y is not None and abs(y) < 1e6:
                    pts.append({'x': round(x, 2), 'y': round(y, 4)})
            except:
                continue

        if not pts:
            return jsonify({'error': 'Could not evaluate expression'}), 400

        chart = {
            'type': 'scatter',
            'data': {
                'datasets': [{
                    'label': expression,
                    'data': pts,
                    'showLine': True,
                    'borderColor': '#3b82f6',
                    'backgroundColor': 'rgba(59,130,246,0.1)',
                    'pointRadius': 1,
                    'borderWidth': 2,
                    'fill': True,
                    'tension': 0.1
                }]
            },
            'options': {
                'title': {'display': True, 'text': f'y = {expression}', 'fontColor': '#f1f5f9', 'fontSize': 16},
                'legend': {'labels': {'fontColor': '#f1f5f9'}},
                'scales': {
                    'xAxes': [{'gridLines': {'color': 'rgba(255,255,255,0.05)'}, 'ticks': {'fontColor': '#94a3b8'}}],
                    'yAxes': [{'gridLines': {'color': 'rgba(255,255,255,0.05)'}, 'ticks': {'fontColor': '#94a3b8'}}]
                },
                'plugins': {
                    'colors': {'enabled': False}
                },
                'backgroundColor': '#1a2236',
                'width': 600,
                'height': 400
            }
        }

        chart_json = json.dumps(chart)
        url = f'https://quickchart.io/chart?c={urllib.parse.quote(chart_json)}&width=600&height=400&backgroundColor=1a2236'
        r = requests.get(url, timeout=15)
        if r.status_code == 200:
            img_b64 = base64.b64encode(r.content).decode('utf-8')
            return jsonify({'image': f'data:image/png;base64,{img_b64}', 'url': url})
        return jsonify({'error': f'QuickChart returned {r.status_code}'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5050))
    app.run(host='0.0.0.0', port=port, debug=True)
