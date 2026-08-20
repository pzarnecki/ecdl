
let timerInterval = null;
let timeRemaining = 0;

function updateTimerDisplay() {
    const timerEl = document.getElementById('timer-display');
    if (!timerEl) return;
    
    if (timeRemaining >= 0) {
        const m = Math.floor(timeRemaining / 60);
        const s = timeRemaining % 60;
        timerEl.innerText = `⏳ Czas: ${m}:${s.toString().padStart(2, '0')}`;
        timerEl.style.color = timeRemaining < 60 ? '#d9534f' : 'inherit';
    } else {
        const over = Math.abs(timeRemaining);
        const m = Math.floor(over / 60);
        const s = over % 60;
        timerEl.innerText = `⏳ Przekroczony czas: -${m}:${s.toString().padStart(2, '0')}`;
        timerEl.style.color = '#d9534f';
    }
}

// Nawigacja po zakładkach
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active');
    });
});

// ----------------------------------------------------
// Ładowanie Zadań Praktycznych i Filtrów
// ----------------------------------------------------
const dateSelect = document.getElementById('filter-date');
const uniqueDates = [...new Set(db_practical.map(t => t.date).filter(Boolean))].sort((a,b) => new Date(b) - new Date(a));
uniqueDates.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.innerText = d;
    dateSelect.appendChild(opt);
});

function loadPracticalTasks() {
    const sourceFilter = document.getElementById('filter-practical').value;
    const dateFilter = document.getElementById('filter-date').value;
    const list = document.getElementById('practical-list');
    list.innerHTML = '';
    
    // Filtrowanie
    let filteredDB = db_practical;
    if (sourceFilter !== 'all') {
        filteredDB = filteredDB.filter(t => t.source === sourceFilter);
    }
    if (dateFilter !== 'all') {
        filteredDB = filteredDB.filter(t => t.date === dateFilter);
    }

    // Sortowanie po dacie (od najnowszych), jeśli data istnieje
    const sortedTasks = [...filteredDB].sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date('2020-01-01');
        const dateB = b.date ? new Date(b.date) : new Date('2020-01-01');
        return dateB - dateA;
    });

    sortedTasks.forEach(task => {
        const sourceBadge = task.source === 'author' 
            ? '<span class="badge author">Zadanie autorskie</span>' 
            : '<span class="badge external">Gotowiec / Oficjalne</span>';
        
        const dateBadge = task.date 
            ? `<span class="badge" style="background:#fff3cd; color:#856404; border:1px solid #ffeeba;">${task.date}</span>` 
            : '';

        let actionsHtml = `<a href="zadania_pliki/${task.file}" class="btn" target="_blank" download>Otwórz / Pobierz Pliki</a>`;
        
        if (task.questionFile) {
            actionsHtml += `<a href="zadania_pliki/${task.questionFile}" class="btn" style="background-color: #28a745; margin-top: 5px;" target="_blank" download>Pobierz Arkusz Pytań</a>`;
        }

        const li = document.createElement('li');
        li.className = 'item-card';
        li.innerHTML = `
            <div class="item-info">
                <span class="module-tag">${task.module}</span> ${sourceBadge} ${dateBadge}
                <h3>${task.title}</h3>
                <p>${task.description}</p>
            </div>
            <div class="item-action" style="display: flex; flex-direction: column; gap: 5px;">
                ${actionsHtml}
            </div>
        `;
        list.appendChild(li);
    });
}
loadPracticalTasks();

document.getElementById('filter-practical').addEventListener('change', loadPracticalTasks);
document.getElementById('filter-date').addEventListener('change', loadPracticalTasks);


// ----------------------------------------------------
// Logika Testów Interaktywnych (Quiz)
// ----------------------------------------------------
let currentQuizData = [];
let userAnswers = []; // Tablica do zapisywania odpowiedzi użytkownika
let currentQuestionIndex = 0;
let score = 0;
let answered = false;

const setupUI = document.getElementById('quiz-setup');
const containerUI = document.getElementById('quiz-container');
const resultUI = document.getElementById('result-container');

document.getElementById('btn-start-quiz').addEventListener('click', () => {
    const module = document.getElementById('quiz-module').value;
    let count = parseInt(document.getElementById('quiz-count').value);
    
    // Filtrowanie bazy
    let filteredDB = module === "ALL" ? db_theory : db_theory.filter(q => q.module === module);
    
    if(count > filteredDB.length) {
        count = filteredDB.length;
    }
    
    // Tasowanie pytań za pomocą algorytmu Fisher-Yates
    let shuffled = [...filteredDB];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    currentQuizData = shuffled.slice(0, count);
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    
    setupUI.style.display = 'none';
    resultUI.style.display = 'none';
    containerUI.style.display = 'block';
    
    loadQuestion();
});

function loadQuestion() {
    answered = false;
    const qData = currentQuizData[currentQuestionIndex];
    
    document.getElementById('quiz-progress-text').innerText = `Pytanie ${currentQuestionIndex + 1} z ${currentQuizData.length}`;
    document.getElementById('quiz-current-module').innerText = qData.module;
    document.getElementById('question-text').innerText = qData.question;
    
    const optionsList = document.getElementById('options-list');
    optionsList.innerHTML = '';
    
    qData.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.dataset.idx = idx;
        
        btn.addEventListener('click', () => {
            if(answered) return;
            document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.getElementById('btn-next-question').disabled = false;
        });
        
        optionsList.appendChild(btn);
    });
    
    const nextBtn = document.getElementById('btn-next-question');
    nextBtn.innerText = "Sprawdź odpowiedź";
    nextBtn.disabled = true;
    
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    
    newNextBtn.addEventListener('click', handleNextAction);
}

function handleNextAction() {
    const nextBtn = document.getElementById('btn-next-question');
    const qData = currentQuizData[currentQuestionIndex];
    const selectedBtn = document.querySelector('.option-btn.selected');
    
    if(!answered) {
        answered = true;
        const selectedIdx = parseInt(selectedBtn.dataset.idx);
        
        document.querySelectorAll('.option-btn').forEach(b => {
            b.style.pointerEvents = 'none';
            if (parseInt(b.dataset.idx) === qData.answer) {
                b.classList.add('correct');
            } else if (b === selectedBtn) {
                b.classList.add('wrong');
            }
        });
        
        const isCorrect = (selectedIdx === qData.answer);
        if(isCorrect) {
            score++;
        }
        
        // Zapisz odpowiedź do podsumowania
        userAnswers.push({
            question: qData.question,
            options: qData.options,
            answerIdx: qData.answer,
            selectedIdx: selectedIdx,
            isCorrect: isCorrect
        });
        
        if(currentQuestionIndex === currentQuizData.length - 1) {
            nextBtn.innerText = "Zakończ i pokaż wynik";
        } else {
            nextBtn.innerText = "Następne pytanie";
        }
        
    } else {
        currentQuestionIndex++;
        if(currentQuestionIndex < currentQuizData.length) {
            loadQuestion();
        } else {
            showResults();
        }
    }
}

function showResults() {
    if (timerInterval) clearInterval(timerInterval);

    containerUI.style.display = 'none';
    resultUI.style.display = 'block';
    
    const percentage = Math.round((score / currentQuizData.length) * 100);
    const scoreText = document.getElementById('result-score-text');
    const msgText = document.getElementById('result-message');
    
    scoreText.innerText = `${score} / ${currentQuizData.length} (${percentage}%)`;
    
    if (percentage >= 75) {
        scoreText.className = 'result-score pass';
        msgText.className = 'result-message pass';
        msgText.innerText = "Egzamin zaliczony! Gratulacje, posiadasz odpowiednią wiedzę.";
    } else {
        scoreText.className = 'result-score fail';
        msgText.className = 'result-message fail';
        msgText.innerText = "Egzamin niezaliczony. Wymagane jest 75% poprawnych odpowiedzi. Przejrzyj swoje błędy poniżej i spróbuj ponownie!";
    }

    // Renderuj podsumowanie odpowiedzi
    const reviewList = document.getElementById('result-review-list');
    reviewList.innerHTML = '<h3>Szczegółowe podsumowanie Twojego testu:</h3><br>';
    
    userAnswers.forEach((ans, i) => {
        const color = ans.isCorrect ? '#155724' : '#721c24';
        const bgColor = ans.isCorrect ? '#d4edda' : '#f8d7da';
        const borderColor = ans.isCorrect ? '#c3e6cb' : '#f5c6cb';
        
        const correctText = ans.options[ans.answerIdx];
        const selectedText = isNaN(ans.selectedIdx) ? "Brak" : ans.options[ans.selectedIdx];
        
        let html = `
            <div style="margin-bottom:15px; padding:15px; border:1px solid ${borderColor}; border-left:5px solid ${color}; background:${bgColor}; border-radius:4px;">
                <p style="margin-bottom: 8px;"><strong>${i+1}. ${ans.question}</strong></p>
                <p style="margin-bottom: 4px;">Twoja odpowiedź: <span style="font-weight:bold; color:${color}">${selectedText}</span></p>
        `;
        
        if (!ans.isCorrect) {
            html += `<p>Prawidłowa odpowiedź: <strong>${correctText}</strong></p>`;
        }
        
        html += `</div>`;
        reviewList.innerHTML += html;
    });
}

document.getElementById('btn-restart-quiz').addEventListener('click', () => {
    resultUI.style.display = 'none';
    setupUI.style.display = 'block';
});


// Obsługa trybu ciemnego
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    // Sprawdź zapisany motyw
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerText = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            themeToggle.innerText = '☀️';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggle.innerText = '🌙';
        }
    });
}

