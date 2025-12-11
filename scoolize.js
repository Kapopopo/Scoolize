const API_URL = "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-parcoursup/records";

let currentOffset = 0;
let currentQuery = "";
let bulletinUploaded = false;
let currentFormation = null;


const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const resultsGrid = document.getElementById('results-grid');
const loader = document.getElementById('loader');
const statsDiv = document.getElementById('stats');
const loadMoreBtn = document.getElementById('load-more-btn');

const schoolModal = document.getElementById("school-modal");
const closeSchoolBtn = document.getElementById("close-school-btn");
const mTitle = document.getElementById("modal-title");
const mFormation = document.getElementById("modal-formation");
const mCity = document.getElementById("modal-city");
const mAcad = document.getElementById("modal-acad");
const mPlaces = document.getElementById("modal-places");
const mTaux = document.getElementById("modal-taux");
const inputLettre = document.getElementById("input-lettre");
const inputCV = document.getElementById("input-cv");
const submitBtn = document.getElementById("submit-dossier-btn");

const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const analysisResult = document.getElementById("analysis-result");
const analysisLoader = document.getElementById("analysis-loader");
const analysisContent = document.getElementById("analysis-content");
const detectedGrade = document.getElementById("detected-grade");
const detectedComment = document.getElementById("detected-comment");

const authModal = document.getElementById("auth-modal");
const openAuthBtn = document.getElementById("open-auth-btn");
const closeAuthBtn = document.getElementById("close-auth-btn");
const userDisplay = document.getElementById("user-display");
const userNameSpan = document.getElementById("user-name");
const logoutLink = document.getElementById("logout-link");

const loginIne = document.getElementById("login-ine");
const loginPwd = document.getElementById("login-pwd");
const regIne = document.getElementById("reg-ine");
const regName = document.getElementById("reg-name");
const regPwd = document.getElementById("reg-pwd");
const loginError = document.getElementById("login-error");
const btnLoginAction = document.getElementById("btn-login-action");
const btnRegisterAction = document.getElementById("btn-register-action");

const qDomain = document.getElementById("q-domain");
const qType = document.getElementById("q-type");
const qCity = document.getElementById("q-city");
const qRythme = document.getElementById("q-rythme");
const orientationBtn = document.getElementById("orientation-submit");

const voeuxList = document.getElementById("voeux-list");
const voeuxEmpty = document.getElementById("voeux-empty");
const voeuxCount = document.getElementById("voeux-count");



dropZone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", function () {
    if (this.files && this.files[0]) {
        // Simulation de l'analyse
        dropZone.style.display = "none";
        analysisResult.style.display = "block";
        analysisLoader.style.display = "block";
        analysisContent.style.display = "none";

        setTimeout(() => {
            analysisLoader.style.display = "none";
            analysisContent.style.display = "block";

            const randomGrade = (Math.random() * (16.5 - 11.0) + 11.0).toFixed(2);
            detectedGrade.innerText = randomGrade + "/20";

            let comment = "Résultats convenables, élève sérieux.";
            if (randomGrade > 15) comment = "Excellents résultats, profil très favorable.";
            else if (randomGrade < 12) comment = "Ensemble fragile, des efforts à fournir.";

            detectedComment.innerText = comment;
            bulletinUploaded = true;

        }, 2000);
    }
});


function checkUserSession() {
    const user = localStorage.getItem("psup_user_session");
    if (user) {
        const userData = JSON.parse(user);
        openAuthBtn.style.display = "none";
        userDisplay.style.display = "block";
        userNameSpan.innerText = userData.name;
        return true;
    } else {
        openAuthBtn.style.display = "block";
        userDisplay.style.display = "none";
        return false;
    }
}

btnRegisterAction.onclick = function () {
    const ine = regIne.value.trim();
    const name = regName.value.trim();
    const pwd = regPwd.value.trim();
    if (!ine || !name || !pwd) { alert("Champs incomplets."); return; }
    localStorage.setItem("psup_db_" + ine, JSON.stringify({ ine, name, password: pwd }));
    alert("Compte créé !");
    switchAuthTab('login');
    loginIne.value = ine;
};

btnLoginAction.onclick = function () {
    const ine = loginIne.value.trim();
    const pwd = loginPwd.value.trim();
    const stored = localStorage.getItem("psup_db_" + ine);
    if (stored && JSON.parse(stored).password === pwd) {
        localStorage.setItem("psup_user_session", stored);
        authModal.style.display = "none";
        checkUserSession();
    } else {
        loginError.style.display = "block";
    }
};

logoutLink.onclick = function () {
    localStorage.removeItem("psup_user_session");
    checkUserSession();
    alert("Déconnecté.");
};

window.switchAuthTab = function (t) {
    document.querySelectorAll('#auth-modal .tab-content').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('#auth-modal .tab-link').forEach(b => b.classList.remove('active'));
    if (t === 'login') {
        document.getElementById('auth-tab-login').classList.add('active');
        document.querySelectorAll('#auth-modal .tab-link')[0].classList.add('active');
    } else {
        document.getElementById('auth-tab-register').classList.add('active');
        document.querySelectorAll('#auth-modal .tab-link')[1].classList.add('active');
    }
};


function getSavedVoeux() {
    try {
        const raw = localStorage.getItem("scoolize_voeux");
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function renderVoeux() {
    if (!voeuxList || !voeuxEmpty || !voeuxCount) return;

    const voeux = getSavedVoeux();
    voeuxList.innerHTML = "";
    voeuxCount.innerText = voeux.length.toString();

    if (!voeux.length) {
        voeuxEmpty.style.display = "block";
        return;
    }

    voeuxEmpty.style.display = "none";

    voeux.forEach((v, index) => {
        const li = document.createElement("li");
        li.className = "voeu-item";
        li.innerHTML = `
            <div class="voeu-main">
                <span class="voeu-rank">${index + 1}</span>
                <div>
                    <div><strong>${v.formation}</strong></div>
                    <div class="voeu-meta">${v.ecole} • ${v.ville}</div>
                </div>
            </div>
            <button class="voeu-delete" data-id="${v.id}">Retirer</button>
        `;
        voeuxList.appendChild(li);
    });

    document.querySelectorAll(".voeu-delete").forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            const updated = getSavedVoeux().filter(v => v.id !== id);
            localStorage.setItem("scoolize_voeux", JSON.stringify(updated));
            renderVoeux();
        };
    });
}

function saveVoeuFromCurrent() {
    if (!currentFormation) return;

    const voeux = getSavedVoeux();
    const id = [
        currentFormation.g_ea_lib_vx || "",
        currentFormation.form_lib_voe_acc || "",
        currentFormation.ville_etab || ""
    ].join("|");

    if (voeux.some(v => v.id === id)) {
        return;
    }

    const newVoeu = {
        id: id,
        ecole: currentFormation.g_ea_lib_vx || "Établissement",
        formation: currentFormation.form_lib_voe_acc || "Formation",
        ville: currentFormation.ville_etab || ""
    };

    voeux.push(newVoeu);
    localStorage.setItem("scoolize_voeux", JSON.stringify(voeux));
    renderVoeux();
}


function initOrientationQuestionnaire() {
    if (!orientationBtn) return;

    orientationBtn.onclick = function () {
        const domain = qDomain ? qDomain.value : "";
        const type = qType ? qType.value : "";
        const city = qCity ? qCity.value.trim() : "";
        const rythme = qRythme ? qRythme.value : "";

        if (!domain && !type && !city && !rythme) {
            alert("Réponds au moins à une question pour que je puisse te proposer des voeux 🙂");
            return;
        }

        let parts = [];

        switch (domain) {
            case "info":
                parts.push("informatique numérique");
                break;
            case "commerce":
                parts.push("commerce gestion marketing");
                break;
            case "sante":
                parts.push("santé social");
                break;
            case "sciences":
                parts.push("sciences ingénieur");
                break;
            case "lettres":
                parts.push("lettres langues");
                break;
        }

        if (type) {
            parts.push(type);
        }

        // Ville
        if (city) {
            parts.push(city);
        }

        if (!type) {
            if (rythme === "selectif") parts.push("CPGE prépa");
            if (rythme === "pratique") parts.push("BTS BUT");
            if (rythme === "equilibre") parts.push("licence BUT");
        }

        const query = parts.join(" ");
        searchInput.value = query;
        fetchFormations(query, true);
    };
}

async function fetchFormations(query, isNew = true) {
    loader.style.display = 'block';
    if (isNew) { currentOffset = 0; currentQuery = query; resultsGrid.innerHTML = ''; loadMoreBtn.style.display = 'none'; statsDiv.innerText = 'Recherche...'; }
    else { currentOffset += 20; }

    try {
        const url = `${API_URL}?limit=20&offset=${currentOffset}&where=search(*, "${encodeURIComponent(query)}")`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Err");
        const data = await res.json();
        const results = data.results || [];
        statsDiv.innerText = `${data.total_count || 0} résultats`;
        displayResults(results);
        if ((currentOffset + 20) < data.total_count) loadMoreBtn.style.display = 'inline-block';
        else loadMoreBtn.style.display = 'none';
    } catch (e) { statsDiv.innerText = "Erreur technique."; }
    finally { loader.style.display = 'none'; }
}

function displayResults(results) {
    if (!results.length && currentOffset === 0) { statsDiv.innerText = "Aucun résultat."; return; }
    results.forEach(item => {
        const card = document.createElement('div'); card.className = 'card';
        card.innerHTML = `<div><h3>${item.g_ea_lib_vx || "Établissement"}</h3><div class="formation">${item.form_lib_voe_acc || "Formation"}</div><div class="city">Ville : ${item.ville_etab || "Ville"}</div></div><div class="tags"><span class="tag">${item.filiere_libelle_detaille || "Autre"}</span></div>`;
        card.addEventListener('click', () => openSchoolModal(item));
        resultsGrid.appendChild(card);
    });
}


function openSchoolModal(data) {
    currentFormation = data;

    mTitle.innerText = data.g_ea_lib_vx || "Inconnu";
    mFormation.innerText = data.form_lib_voe_acc || "-";
    mCity.innerText = data.ville_etab || "-";
    mAcad.innerText = data.acad_mies || "-";
    mPlaces.innerText = data.capa_fin || "N/C";

    if (data.taux_acces_ens) {
        const t = Math.round(data.taux_acces_ens);
        mTaux.innerText = `${t}%`;
        mTaux.style.color = t < 20 ? "#E1000F" : (t > 60 ? "#008000" : "#000091");
    } else {
        mTaux.innerText = "-";
        mTaux.style.color = "inherit";
    }

    inputLettre.value = "";
    inputCV.value = "";
    bulletinUploaded = false;
    dropZone.style.display = "block";
    analysisResult.style.display = "none";

    submitBtn.innerText = "Enregistrer et confirmer le voeu";
    submitBtn.style.backgroundColor = "";

    switchTab('info');
    schoolModal.style.display = "block";
}


window.switchTab = function (t) {
    document.querySelectorAll('#school-modal .tab-content').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('#school-modal .tab-link').forEach(b => b.classList.remove('active'));
    if (t === 'info') {
        document.getElementById('tab-info').classList.add('active');
        document.querySelectorAll('#school-modal .tab-link')[0].classList.add('active');
    } else {
        document.getElementById('tab-dossier').classList.add('active');
        document.querySelectorAll('#school-modal .tab-link')[1].classList.add('active');
    }
};

submitBtn.onclick = function () {
    if (!checkUserSession()) {
        schoolModal.style.display = "none";
        authModal.style.display = "block";
        alert("🔒 Connectez-vous d'abord.");
        return;
    }
    if (!bulletinUploaded) {
        alert("⚠️ Veuillez charger vos bulletins scolaires avant de valider.");
        return;
    }
    if (inputLettre.value.length < 10) {
        alert("⚠️ Projet de formation manquant.");
        return;
    }

    submitBtn.innerText = "Validation...";
    submitBtn.style.backgroundColor = "#666";

    setTimeout(() => {
        submitBtn.innerText = "Voeu confirmé";
        submitBtn.style.backgroundColor = "#008000";

        saveVoeuFromCurrent();

        alert("Succès : Dossier complet envoyé ! Ton voeu a été ajouté dans « Mes voeux ».");
        setTimeout(() => schoolModal.style.display = "none", 800);
    }, 800);
};


openAuthBtn.onclick = () => authModal.style.display = "block";
closeAuthBtn.onclick = () => authModal.style.display = "none";
closeSchoolBtn.onclick = () => schoolModal.style.display = "none";
window.onclick = (e) => {
    if (e.target == schoolModal) schoolModal.style.display = "none";
    if (e.target == authModal) authModal.style.display = "none";
};

searchBtn.onclick = () => { if (searchInput.value) fetchFormations(searchInput.value, true); };
searchInput.onkeypress = (e) => { if (e.key === 'Enter' && searchInput.value) fetchFormations(searchInput.value, true); };
loadMoreBtn.onclick = () => fetchFormations(currentQuery, false);

checkUserSession();
renderVoeux();
initOrientationQuestionnaire();
fetchFormations("Informatique");
