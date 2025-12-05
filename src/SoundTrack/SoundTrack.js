// =========================
// DADOS DAS TEMPORADAS
// =========================
const temporadas = {
    index: [
        { nome: "Index I", img: "logos/index1.png" },
        { nome: "Index II", img: "logos/index2.png" },
        { nome: "Index III", img: "logos/index3.png" }
    ],
    railgun: [
        { nome: "Railgun", img: "logos/railgun.png" },
        { nome: "Railgun S", img: "logos/railguns.png" },
        { nome: "Railgun T", img: "logos/railgunt.png" }
    ],
    accelerator: [
        { nome: "Accelerator", img: "logos/accelerator.jpg" }
    ]
};

// =========================
// BANCO DE MÚSICAS
// =========================
const musicas = {
    "Railgun S": {
        op: [
            { nome: "Sister's Noise", artista: "FripSide", audio: "audios/sisters-noise.mp3", video: "videos/sisters-noise.mp4", thumb: "https://via.placeholder.com/150?text=Sister's+Noise" },
            { nome: "Eternal Reality", artista: "FripSide", audio: "audios/eternal-reality.mp3", video: "videos/eternal-reality.mp4", thumb: "https://via.placeholder.com/150?text=Eternal+Reality" }
        ],
        ed: [
            { nome: "Grow Slowly", artista: "FripSide", audio: "audios/grow-slowly.mp3", video: "videos/grow-slowly.mp4", thumb: "https://via.placeholder.com/150?text=Grow+Slowly" }
        ]
    }
};

// =========================
// ELEMENTOS
// =========================
const serieSelect = document.getElementById("serie");
const listaTemporadas = document.getElementById("lista-temporadas");
const resultado = document.getElementById("resultado");
const listaMusicas = document.getElementById("lista-musicas");

const btnOp = document.getElementById("btn-op");
const btnEd = document.getElementById("btn-ed");

const btnAudio = document.getElementById("btn-audio");
const btnVideo = document.getElementById("btn-video");

let temporadaSelecionada = "";
let tipoSelecionado = "";
let modoSelecionado = "audio";
let musicaSelecionada = null;

// =========================
// SELEÇÃO DE SÉRIE
// =========================
serieSelect.addEventListener("change", () => {
    const serie = serieSelect.value;
    listaTemporadas.innerHTML = "";
    listaMusicas.innerHTML = "";
    resultado.innerHTML = "";
    temporadaSelecionada = "";
    musicaSelecionada = null;

    if (!serie) return;

    temporadas[serie].forEach(temp => {
        const div = document.createElement("div");
        div.classList.add("temporada");
        div.innerHTML = `
            <img src="${temp.img}" alt="${temp.nome}">
            <p>${temp.nome}</p>
        `;

        div.addEventListener("click", () => {
            document.querySelectorAll(".temporada").forEach(t => t.classList.remove("selecionada"));
            div.classList.add("selecionada");
            temporadaSelecionada = temp.nome;

            carregarListaMusicasComThumb();
        });

        listaTemporadas.appendChild(div);
    });
});

// =========================
// BOTÕES OPENING / ENDING
// =========================
btnOp.addEventListener("click", () => {
    tipoSelecionado = "op";
    btnOp.classList.add("selecionado");
    btnEd.classList.remove("selecionado");

    carregarListaMusicasComThumb();
});

btnEd.addEventListener("click", () => {
    tipoSelecionado = "ed";
    btnEd.classList.add("selecionado");
    btnOp.classList.remove("selecionado");

    carregarListaMusicasComThumb();
});

// =========================
// LISTAR MÚSICAS COM THUMBNAILS
// =========================
function carregarListaMusicasComThumb() {
    listaMusicas.innerHTML = "";
    musicaSelecionada = null;

    if (!temporadaSelecionada || !tipoSelecionado) return;
    if (!musicas[temporadaSelecionada]) return;
    if (!musicas[temporadaSelecionada][tipoSelecionado]) return;

    const lista = musicas[temporadaSelecionada][tipoSelecionado];

    lista.forEach((musica) => {
        const div = document.createElement("div");
        div.classList.add("musica-card");

        div.innerHTML = `
            <img src="${musica.thumb || 'https://via.placeholder.com/150?text=Sem+Imagem'}" alt="${musica.nome}">
            <div class="musica-info">
                <p class="nome">${musica.nome}</p>
                <p class="artista">${musica.artista}</p>
            </div>
        `;

        div.addEventListener("click", () => {
            document.querySelectorAll(".musica-card").forEach(c => c.classList.remove("selecionado"));
            div.classList.add("selecionado");
            musicaSelecionada = musica;
            tocarMidia();
        });

        listaMusicas.appendChild(div);
    });

    resultado.innerHTML = "";
}

// =========================
// ÁUDIO / VÍDEO
// =========================
btnAudio.addEventListener("click", () => {
    modoSelecionado = "audio";
    btnAudio.classList.add("selecionado");
    btnVideo.classList.remove("selecionado");

    tocarMidia();
});

btnVideo.addEventListener("click", () => {
    modoSelecionado = "video";
    btnVideo.classList.add("selecionado");
    btnAudio.classList.remove("selecionado");

    tocarMidia();
});

// =========================
// PLAYER FINAL
// =========================
function tocarMidia() {
    if (!musicaSelecionada) return;

    resultado.innerHTML = `
        <b>Tocando:</b> ${musicaSelecionada.nome}<br>
        <b>Artista:</b> ${musicaSelecionada.artista}<br><br>
    `;

    if (modoSelecionado === "audio") {
        resultado.innerHTML += `
            <audio controls autoplay>
                <source src="${musicaSelecionada.audio}" type="audio/mp3">
            </audio>
        `;
    } else {
        resultado.innerHTML += `
            <video width="450" controls autoplay>
                <source src="${musicaSelecionada.video}" type="video/mp4">
            </video>
        `;
    }
}
