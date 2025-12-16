const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const apiKeyInput = document.getElementById('apiKeyInput');

// Sections
const uploadSection = document.getElementById('uploadSection');
const loadingSection = document.getElementById('loadingSection');
const dashboardSection = document.getElementById('dashboardSection');

// Elements to update
const totalRowsEl = document.getElementById('totalRows');
const issueCountEl = document.getElementById('issueCount');
const qualityScoreEl = document.getElementById('qualityScore');
const issuesListEl = document.getElementById('issuesList');
const loadingText = document.getElementById('loadingText');

let currentFilename = "";

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#6366f1';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    const files = e.dataTransfer.files;
    if (files.length) handleFileUpload(files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFileUpload(e.target.files[0]);
});

async function handleFileUpload(file) {
    if (!apiKeyInput.value) {
        alert("Please enter a Gemini API Key first (top right)");
        return;
    }

    showSection('loading');

    // 1. Upload File
    const formData = new FormData();
    formData.append('file', file);

    try {
        const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!uploadRes.ok) throw new Error("Upload Failed");

        const uploadData = await uploadRes.json();
        currentFilename = uploadData.filename;
        totalRowsEl.textContent = uploadData.total_rows;

        // Render Data Preview (NEW)
        if (uploadData.preview_rows && uploadData.columns) {
            renderTable(uploadData.columns, uploadData.preview_rows);
        }

        // 2. Perform AI Analysis
        loadingText.textContent = "AI is consulting the oracle...";

        const analyzeRes = await fetch(`/api/analyze?filename=${currentFilename}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKeyInput.value })
        });

        if (!analyzeRes.ok) throw new Error("Analysis Failed");

        const analysisData = await analyzeRes.json();

        renderDashboard(analysisData);
        showSection('dashboard');

    } catch (error) {
        alert(error.message);
        showSection('upload');
    }
}

function renderTable(columns, rows) {
    const thead = document.getElementById('tableHeader');
    const tbody = document.getElementById('tableBody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Headers
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        thead.appendChild(th);
    });

    // Rows
    rows.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            // row is an object like { "col1": "val1", "col2": "val2" }
            td.textContent = row[col] !== null ? row[col] : '-';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function renderDashboard(data) {
    if (data.quality_score) {
        qualityScoreEl.textContent = data.quality_score;
        // Color code score
        if (data.quality_score > 80) qualityScoreEl.style.color = '#4ade80';
        else if (data.quality_score > 50) qualityScoreEl.style.color = '#facc15';
        else qualityScoreEl.style.color = '#ef4444';
    }

    issuesListEl.innerHTML = '';

    if (data.issues && data.issues.length > 0) {
        issueCountEl.textContent = data.issues.length;

        data.issues.forEach(issue => {
            const li = document.createElement('li');
            li.className = 'issue-item';
            li.innerHTML = `
                <div>
                    <strong>${issue.column || 'General'}</strong>: ${issue.description}
                </div>
                <span class="issue-tag">${issue.issue_type}</span>
            `;
            issuesListEl.appendChild(li);
        });
    } else {
        issueCountEl.textContent = "0";
        issuesListEl.innerHTML = '<li class="issue-item" style="border-left-color: #4ade80"><div>No significant issues found!</div></li>';
    }
}

function showSection(sectionId) {
    uploadSection.classList.add('hidden');
    loadingSection.classList.add('hidden');
    dashboardSection.classList.add('hidden');

    document.getElementById(sectionId + 'Section').classList.remove('hidden');
}

function resetApp() {
    currentFilename = "";
    fileInput.value = "";
    showSection('upload');
}
