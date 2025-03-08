// app.js
// Importe o PDF.js no topo do arquivo (nível superior do módulo)
import * as pdfjsLib from './pdfjs/pdf.mjs';
//agora
// Configuração do worker (também no topo)
pdfjsLib.GlobalWorkerOptions.workerSrc = './pdfjs/pdf.worker.mjs';

let questionIndex = 1;
// Arrays para armazenar números e letras do gabarito processado
let numeros = [];
let letras = [];

// Função para coletar valores dos radios e calcular o resultado
window.pegar_valores = function () {
    const inputGabarito = document.getElementById("colargabarito"); // Obtenha o elemento inputGabarito
    if (!inputGabarito.value.trim()) { // Verifica se o campo gabarito está vazio
        alert("Por favor, insira o gabarito para calcular o resultado."); // Mensagem instrutiva
        return; // Sai da função se o gabarito estiver vazio
    }

    const respostasUsuario = {};
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        if (radio.checked) {
            respostasUsuario[radio.name] = radio.value;
        }
    });

    let pontuacao = 0;
    let totalAcertos = 0;
    let totalQuestoes = 0;

    const configuracaoPesos = obterConfiguracaoPesos();

    for (let i = 0; i < numeros.length; i++) {
        const numeroQuestao = numeros[i];
        const respostaCorreta = letras[i];
        const nomeQuestao = `question${numeroQuestao}`;
        let pesoQuestao = 1;
        totalQuestoes++;

        for (const grupo of configuracaoPesos) {
            if (numeroQuestao >= grupo.inicio && numeroQuestao <= grupo.fim) {
                pesoQuestao = grupo.peso;
                break;
            }
        }

        if (respostasUsuario[nomeQuestao] && respostasUsuario[nomeQuestao].toLowerCase() === respostaCorreta.toLowerCase()) {
            pontuacao += pesoQuestao;
            totalAcertos++;
        }
    }

    alert(`Resultado: ${totalAcertos} acertos de ${totalQuestoes} questões.\nPontuação Total: ${pontuacao}`);
};

// Função para processar o texto do gabarito e preencher arrays 'numeros' e 'letras'
function processarTexto(textoGabarito) {
    numeros = [];
    letras = [];
    let tempNumero = '';
    let tempLetras = '';

    for (let char of textoGabarito) {
        if (/\d/.test(char)) {
            tempNumero += char;
        } else if (/[a-e]/i.test(char)) {
            tempLetras += char.toLowerCase();
        } else {
            if (tempNumero) {
                numeros.push(parseInt(tempNumero, 10));
                tempNumero = '';
            }
            if (tempLetras) {
                letras.push(...tempLetras.split(''));
                tempLetras = '';
            }
        }
    }

    if (tempNumero) numeros.push(parseInt(tempNumero, 10));
    if (tempLetras) letras.push(...tempLetras.split(''));

    console.log("Números:", numeros);
    console.log("Letras:", letras);
}

// Aguarde o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
    const pdfInput = document.getElementById('pdf-input');
    const pdfViewer = document.getElementById('pdf-viewer');
    const inputGabarito = document.getElementById("colargabarito");
    const btnResultado = document.getElementById("btn_resultado");

    inputGabarito.addEventListener("input", function () {
        processarTexto(inputGabarito.value);
    });

    btnResultado.addEventListener("click", pegar_valores);

    pdfInput.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            const fileReader = new FileReader();
            fileReader.onload = function () {
                const typedArray = new Uint8Array(this.result);
                loadPDF(typedArray);
            };
            fileReader.readAsArrayBuffer(file);
        } else {
            alert('Por favor, selecione um arquivo PDF válido.');
        }
    });

    function loadPDF(data) {
        pdfjsLib.getDocument({ data }).promise.then(pdf => {
            pdfViewer.innerHTML = '';
            let pageNumber = 1;
            questionIndex = 1;
            numeros = [];
            letras = [];

            const renderPage = (pageNum) => {
                pdf.getPage(pageNum).then(page => {
                    const scale = 1.5;
                    const viewport = page.getViewport({ scale });

                    const pageContainer = document.createElement('div');
                    pageContainer.className = 'page-container';
                    pdfViewer.appendChild(pageContainer);

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    pageContainer.appendChild(canvas);

                    const canvasOffsetX = (pdfViewer.clientWidth - canvas.width) / 2;
                    canvas.style.marginLeft = `${canvasOffsetX}px`;

                    page.render({
                        canvasContext: context,
                        viewport: viewport
                    });

                    page.getTextContent().then(textContent => {
                        const textItems = textContent.items;
                        const overlay = document.createElement('div');
                        overlay.className = 'radio-overlay';
                        pageContainer.appendChild(overlay);

                        textItems.forEach(item => {
                            const text = item.str.trim();
                            const alternatives = ['a)', 'b)', 'c)', 'd)', 'e)', '(a)', '(b)', '(c)', '(d)', '(e)'];

                            alternatives.forEach(alt => {
                                if (text.toLowerCase().startsWith(alt.toLowerCase())) {
                                    const x = item.transform[4] * scale + canvasOffsetX - 21;
                                    const y = viewport.height - item.transform[5] * scale - 15;

                                    const radio = document.createElement('input');
                                    radio.type = 'radio';
                                    radio.name = `question${questionIndex}`;
                                    radio.value = alt.replace(/[()]/g, '');

                                    const container = document.createElement('div');
                                    container.className = 'radio-container';
                                    container.style.left = `${x}px`;
                                    container.style.top = `${y}px`;
                                    container.appendChild(radio);

                                    overlay.appendChild(container);

                                    if (alt.toLowerCase() === 'e)' || alt.toLowerCase() === '(e)') {
                                        questionIndex++;
                                    }
                                }
                            });
                        });
                    });

                    if (pageNum < pdf.numPages) {
                        renderPage(pageNum + 1);
                    }
                });
            };

            renderPage(pageNumber);
        });
    }
});
