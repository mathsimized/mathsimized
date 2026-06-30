#!/usr/bin/env ruby

template = <<~'TEMPLATE'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>%%TITLE%%</title>
  <meta name="description" content="%%DESC%%">
  <meta property="og:title" content="%%TITLE%%">
  <meta property="og:description" content="%%DESC%%">
  <meta property="og:image" content="https://mathsimized.com/logo-v2.png">
  <meta property="og:url" content="%%OGURL%%">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MATHSIMIZED">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>∑</text></svg>">
  <link rel="stylesheet" href="../styles.css">
  <script src="../firebase.js"></script>
  <link rel="canonical" href="%%CANONICAL%%">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="%%TITLE%%">
  <meta name="twitter:description" content="%%DESC%%">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <style>
    .pt-hero {
      min-height: 30vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 120px 24px 40px;
      position: relative;
      overflow: hidden;
    }
    .pt-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, var(--primary-glow) 0%, transparent 70%);
      opacity: 0.3;
    }
    .pt-hero h1 { font-size: 2.5rem; margin-bottom: 12px; position: relative; z-index: 1; }
    .pt-hero p { font-size: 1.1rem; color: var(--muted); max-width: 640px; margin: 0 auto; position: relative; z-index: 1; }
    .breadcrumb {
      display: flex; flex-wrap: wrap; gap: 6px;
      font-size: 0.85rem; color: var(--muted2); margin-bottom: 28px;
    }
    .breadcrumb a { color: var(--muted2); text-decoration: none; }
    .breadcrumb a:hover { color: var(--accent); }
    .breadcrumb .sep { color: var(--muted2); }
    .breadcrumb .current { color: var(--text); }
    .badge-row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 16px; }
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
    }
    .badge-format {
      background: rgba(99,102,241,0.15); color: var(--accent);
      border: 1px solid rgba(99,102,241,0.3);
    }
    .badge-official {
      background: rgba(34,197,94,0.15); color: #22c55e;
      border: 1px solid rgba(34,197,94,0.3);
    }
    .test-info-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 28px 32px; margin-bottom: 28px;
    }
    .test-info-card h2 { margin: 0 0 16px; font-size: 1.3rem; }
    .info-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;
    }
    .info-item { padding: 12px 16px; background: var(--surface2); border-radius: 8px; }
    .info-item .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted2); margin-bottom: 4px; }
    .info-item .value { font-size: 1.05rem; font-weight: 600; color: var(--text); }
    .download-section {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 28px 32px; margin-bottom: 28px;
    }
    .download-section h2 { margin: 0 0 16px; font-size: 1.3rem; }
    .download-buttons { display: flex; flex-wrap: wrap; gap: 12px; }
    .btn-download {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 24px; border-radius: 8px; border: none;
      font-size: 0.9rem; font-weight: 500; cursor: pointer;
      text-decoration: none; transition: opacity 0.2s, transform 0.2s;
    }
    .btn-download:hover { opacity: 0.85; transform: translateY(-1px); }
    .btn-download.primary { background: var(--accent); color: #fff; }
    .btn-download.secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
    .action-buttons { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
    .btn-action {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--surface); color: var(--text); font-size: 0.85rem;
      cursor: pointer; text-decoration: none; transition: background 0.2s, border-color 0.2s;
    }
    .btn-action:hover { border-color: var(--accent); background: var(--surface2); }
    .related-section {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 28px 32px; margin-bottom: 28px;
    }
    .related-section h2 { margin: 0 0 16px; font-size: 1.3rem; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .related-card {
      padding: 16px 20px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--surface2); text-decoration: none; color: var(--text);
      transition: border-color 0.2s, transform 0.2s;
    }
    .related-card:hover { border-color: var(--accent); transform: translateY(-2px); }
    .related-card h3 { margin: 0 0 4px; font-size: 1rem; }
    .related-card p { margin: 0; font-size: 0.8rem; color: var(--muted); }
    .test-nav { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 28px; }
    .test-nav a {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--surface); color: var(--text); text-decoration: none;
      font-size: 0.85rem; transition: border-color 0.2s;
    }
    .test-nav a:hover { border-color: var(--accent); }
    .test-nav a.disabled { opacity: 0.3; pointer-events: none; }
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      color: var(--accent); text-decoration: none; font-size: 0.9rem;
      margin-bottom: 20px;
    }
    .back-link:hover { text-decoration: underline; }
    .disclaimer {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.3);
      border-radius: 10px; padding: 16px 20px; margin-bottom: 28px;
      font-size: 0.85rem; color: var(--muted); line-height: 1.6;
    }
    .disclaimer strong { color: var(--text); }
    @media (max-width: 768px) {
      .pt-hero h1 { font-size: 1.8rem; }
      .info-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

<nav class="navbar">
  <div class="container">
    <a href="../index.html" class="navbar-logo"><img src="../logo-v2.png" alt="MATHSIMIZED" height="32"></a>
    <button class="hamburger" onclick="toggleMobileMenu()">
      <span></span><span></span><span></span>
    </button>
    <ul class="nav-links" id="navLinks">
      <li><a href="../index.html">Home</a></li>
      <li><a href="../about.html">About</a></li>
      <li class="dropdown">
        <a href="#">Resources ▾</a>
        <div class="dropdown-menu">
          <a href="../lectures.html">Lectures</a>
          <a href="../notes.html">Notes</a>
          <a href="../pastpapers.html">Past Papers</a>
        </div>
      </li>
      <li class="dropdown">
        <a href="#">SAT Prep ▾</a>
        <div class="dropdown-menu">
          <a href="practice-tests.html">Practice Tests</a>
          <a href="study-guide.html">Study Guide</a>
        </div>
      </li>
      <li><a href="../news.html">News</a></li>
      <li class="dropdown">
        <a href="#">Games ▾</a>
        <div class="dropdown-menu">
          <a href="../games.html">Play Games</a>
          <a href="../leaderboard.html">Leaderboard</a>
          <a href="../competitions.html">Competitions</a>
        </div>
      </li>
      <li><a href="../contact.html">Contact</a></li>
    </ul>
    <div class="nav-auth" id="navAuth"></div>
  </div>
</nav>

<section class="pt-hero">
  <div style="position:relative;z-index:1;">
    <h1>%%HERO_TITLE%%</h1>
    <p>%%HERO_TEXT%%</p>
    <div class="badge-row">
      <span class="badge badge-format">%%FORMAT_BADGE%%</span>
      <span class="badge badge-official">Official College Board Test</span>
    </div>
  </div>
</section>

<section class="section-padding" style="padding-top:0;">
  <div class="container">

    <a href="practice-tests.html" class="back-link">&larr; Back to Practice Tests</a>

    <div class="breadcrumb">
      <a href="../index.html">Home</a>
      <span class="sep">&rsaquo;</span>
      <a href="../sat-prep/index.html">SAT Prep</a>
      <span class="sep">&rsaquo;</span>
      <a href="practice-tests.html">Practice Tests</a>
      <span class="sep">&rsaquo;</span>
      <span class="current">%%NAV_CURRENT%%</span>
    </div>

    <div class="test-nav">
      <a href="%%PREV_LINK%%" class="%%PREV_CLASS%%">&larr; %%PREV_LABEL%%</a>
      <a href="%%NEXT_LINK%%" class="%%NEXT_CLASS%%">%%NEXT_LABEL%% &rarr;</a>
    </div>

    <div class="disclaimer">
      <strong>Disclaimer:</strong> This practice test is an unmodified PDF copy of the practice test published by College Board. It is provided here for personal study purposes only. SAT<sup>&reg;</sup> and Bluebook<sup>&trade;</sup> are registered trademarks of College Board, which is not affiliated with and does not endorse this website.
    </div>

    <div class="test-info-card">
      <h2>Test Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Time Required</div>
          <div class="value">2 hours 14 minutes</div>
        </div>
        <div class="info-item">
          <div class="label">Total Questions</div>
          <div class="value">98</div>
        </div>
        <div class="info-item">
          <div class="label">Reading &amp; Writing</div>
          <div class="value">54 questions (64 min)</div>
        </div>
        <div class="info-item">
          <div class="label">Math</div>
          <div class="value">44 questions (70 min)</div>
        </div>
        <div class="info-item">
          <div class="label">Format</div>
          <div class="value">%%FORMAT_VALUE%%</div>
        </div>
      </div>
    </div>

    <div class="download-section">
      <h2>Downloads</h2>
      <div class="download-buttons">
        %%DOWNLOAD_BUTTONS%%
      </div>
      <div class="action-buttons">
        <button class="btn-action" onclick="window.print()">&#x2399; Print</button>
        <button class="btn-action" onclick="sharePage()">&#x21B1; Share</button>
      </div>
    </div>

    <div class="related-section">
      <h2>Related Resources</h2>
      <div class="related-grid">
        <a href="study-guide.html#content-domains" class="related-card">
          <h3>SAT Formula Sheet</h3>
          <p>Reference sheet of math formulas used on the SAT.</p>
        </a>
        <a href="practice-tests.html#estimatorCard" class="related-card">
          <h3>SAT Score Estimator</h3>
          <p>Estimate your SAT score based on correct answers.</p>
        </a>
        <a href="study-guide.html" class="related-card">
          <h3>SAT Study Guide</h3>
          <p>Complete guide to test structure, scoring, and prep.</p>
        </a>
      </div>
    </div>

  </div>
</section>

<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <h3>MATH<span>SIMIZED</span></h3>
        <p>Redefining the Limit — Master Mathematics with Expert Guidance</p>
        <div class="footer-social">
          <a href="https://youtube.com/@mathsimized_by_mrkk" target="_blank" rel="noopener" aria-label="YouTube">&#9654;</a>
          <a href="https://www.instagram.com/mathsimized" target="_blank" rel="noopener" aria-label="Instagram">&#9633;</a>
          <a href="mailto:mathsimized@gmail.com" aria-label="Email">&#9993;</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Quick Links</h4>
        <a href="../about.html">About</a>
        <a href="../lectures.html">Lectures</a>
        <a href="../notes.html">Notes</a>
        <a href="../pastpapers.html">Past Papers</a>
        <a href="../contact.html">Contact</a>
      </div>
      <div class="footer-col">
        <h4>SAT Prep</h4>
        <a href="practice-tests.html">Practice Tests</a>
        <a href="study-guide.html">Study Guide</a>
      </div>
      <div class="footer-col">
        <h4>Games</h4>
        <a href="../games.html">Play Games</a>
        <a href="../leaderboard.html">Leaderboard</a>
        <a href="../competitions.html">Competitions</a>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <a href="../privacy.html">Privacy Policy</a>
        <a href="../terms.html">Terms of Service</a>
      </div>
      <div class="footer-col">
        <h4>Connect</h4>
        <a href="https://youtube.com/@mathsimized_by_mrkk" target="_blank">YouTube</a>
        <a href="https://www.instagram.com/mathsimized" target="_blank">Instagram</a>
        <a href="mailto:mathsimized@gmail.com">Email</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 MATHSIMIZED. All rights reserved. Created by Khalilullah Khan.</p>
      <p style="font-size:0.75rem;color:var(--muted2);margin-top:6px;">SAT<sup>&reg;</sup> and Bluebook<sup>&trade;</sup> are registered trademarks of College Board. This website is not affiliated with or endorsed by College Board.</p>
    </div>
  </div>
</footer>

<script>
function toggleMobileMenu() {
  document.getElementById('navLinks').classList.toggle('open');
  document.getElementById("navAuth").classList.toggle("open");
}

function sharePage() {
  if (navigator.share) {
    navigator.share({
      title: '%%SHARE_TITLE%%',
      url: window.location.href
    }).catch(function() {});
  } else {
    var dummy = document.createElement('input');
    dummy.value = window.location.href;
    document.body.appendChild(dummy);
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    alert('Link copied to clipboard!');
  }
}
</script>
</body>
</html>
TEMPLATE

(1..11).each do |n|
  is_digital = n >= 4
  format_label = is_digital ? "Digital" : "Paper"
  format_badge = is_digital ? "Digital Format" : "Paper Format"

  title = "SAT Practice Test #{n} — MATHSIMIZED"
  desc = "Download full-length SAT Practice Test #{n} from College Board. #{is_digital ? 'Digital format with answer explanations and scoring guide.' : 'Paper format with answer key.'}"
  hero_title = "SAT Practice Test #{n}"
  hero_text = is_digital ? "Full-length digital SAT practice test from College Board. Includes answers, explanations, and scoring guide." : "Full-length paper SAT practice test from College Board. Includes answer key."
  nav_current = "Practice Test #{n}"
  share_title = "SAT Practice Test #{n} | MATHSIMIZED"
  og_url = "https://mathsimized.com/sat-prep/practice-test-#{n}.html"
  canonical = og_url

  # File paths
  if is_digital
    test_pdf = "pdfs/sat-#{n}/sat-practice-test-#{n}-digital.pdf"
    answers_pdf = "pdfs/sat-#{n}/sat-practice-test-#{n}-answers-digital.pdf"
    scoring_pdf = "pdfs/sat-#{n}/scoring-sat-practice-test-#{n}-digital.pdf"
    download_buttons = <<~BTNS
      <a href="#{test_pdf}" class="btn-download primary" download>&#9660; Download Test PDF</a>
      <a href="#{answers_pdf}" class="btn-download secondary" download>&#9660; Download Answer Explanations</a>
      <a href="#{scoring_pdf}" class="btn-download secondary" download>&#9660; Download Scoring Guide</a>
    BTNS
  else
    test_pdf = "pdfs/sat-#{n}/SAT#{n}.pdf"
    key_pdf = "pdfs/sat-#{n}/SAT#{n}~Key.pdf"
    download_buttons = <<~BTNS
      <a href="#{test_pdf}" class="btn-download primary" download>&#9660; Download Test PDF</a>
      <a href="#{key_pdf}" class="btn-download secondary" download>&#9660; Download Answer Key</a>
    BTNS
  end

  # Prev/Next links
  prev_link = n > 1 ? "practice-test-#{n - 1}.html" : "#"
  prev_class = n > 1 ? "" : "disabled"
  prev_label = n > 1 ? "Practice Test #{n - 1}" : "Previous"

  next_link = n < 11 ? "practice-test-#{n + 1}.html" : "#"
  next_class = n < 11 ? "" : "disabled"
  next_label = n < 11 ? "Practice Test #{n + 1}" : "Next"

  html = template
    .gsub("%%TITLE%%", title)
    .gsub("%%DESC%%", desc)
    .gsub("%%OGURL%%", og_url)
    .gsub("%%CANONICAL%%", canonical)
    .gsub("%%HERO_TITLE%%", hero_title)
    .gsub("%%HERO_TEXT%%", hero_text)
    .gsub("%%FORMAT_BADGE%%", format_badge)
    .gsub("%%NAV_CURRENT%%", nav_current)
    .gsub("%%PREV_LINK%%", prev_link)
    .gsub("%%PREV_CLASS%%", prev_class)
    .gsub("%%PREV_LABEL%%", prev_label)
    .gsub("%%NEXT_LINK%%", next_link)
    .gsub("%%NEXT_CLASS%%", next_class)
    .gsub("%%NEXT_LABEL%%", next_label)
    .gsub("%%FORMAT_VALUE%%", format_label)
    .gsub("%%DOWNLOAD_BUTTONS%%", download_buttons)
    .gsub("%%SHARE_TITLE%%", share_title)

  filename = "practice-test-#{n}.html"
  File.write(filename, html)
  puts "Created #{filename}"
end

puts "\nAll 11 files generated successfully!"
