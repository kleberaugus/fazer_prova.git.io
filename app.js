// app.js
// Importe o PDF.js no topo do arquivo (nível superior do módulo)
import * as pdfjsLib from './pdfjs/pdf.mjs';

// Configuração do worker (também no topo)
pdfjsLib.GlobalWorkerOptions.workerSrc = './pdfjs/pdf.worker.mjs';

let questionIndex = 1;
// Arrays para armazenar números e letras do gabarito processado
let numeros = [];
let letras = [];

// Função para coletar valores dos radios e calcular o resultado
window.pegar_valores = function() {
    const respostasUsuario = {};
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        if (radio.checked) {
            respostasUsuario[radio.name] = radio.value;
        }
    });

    let pontuacao = 0;
    let totalQuestoes = 0;

    // Vamos iterar usando o array 'numeros' como guia, e usar o índice para 'letras'
    for (let i = 0; i < numeros.length; i++) {
        const numeroQuestao = numeros[i]; // Número da questão do array 'numeros'
        const respostaCorreta = letras[i];   // Resposta correta correspondente do array 'letras'
        const nomeQuestao = `question${numeroQuestao}`; // Formato do name dos radio buttons

        totalQuestoes++; // Incrementa o total de questões consideradas

        if (respostasUsuario[nomeQuestao] && respostasUsuario[nomeQuestao].toLowerCase() === respostaCorreta.toLowerCase()) {
            pontuacao++; // Incrementa a pontuação se a resposta do usuário for igual à correta
        }
    }

    alert(`Resultado: ${pontuacao} acertos de ${totalQuestoes} questões.`);
};

// Função para processar o texto do gabarito e preencher arrays 'numeros' e 'letras'
function processarTexto(textoGabarito) { // Aceita o valor do input como argumento
    let texto = textoGabarito; // Usa o argumento diretamente
    numeros = []; // Limpa os arrays ao processar um novo texto
    letras = [];
    let tempNumero = '';
    let tempLetras = '';

    for (let char of texto) {
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

    // Adicionar restos
    if (tempNumero) numeros.push(parseInt(tempNumero, 10));
    if (tempLetras) letras.push(...tempLetras.split(''));
     console.log("Números:", numeros); // Para debug
     console.log("Letras:", letras);   // Para debug
}

// Aguarde o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
    // Elementos da interface
    const pdfInput = document.getElementById('pdf-input');
    const pdfViewer = document.getElementById('pdf-viewer');
    const inputGabarito = document.getElementById("colargabarito");
    const btnResultado = document.getElementById("btn_resultado");

    // Processar texto do gabarito - Event listener DENTRO do DOMContentLoaded
    inputGabarito.addEventListener("input", function() {
        processarTexto(inputGabarito.value); // Passa o valor do input para processarTexto
    });

    // Quando o usuário seleciona um PDF
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

    // Função para carregar o PDF
    function loadPDF(data) {
        pdfjsLib.getDocument({ data }).promise.then(pdf => {
            pdfViewer.innerHTML = ''; // Limpar o visualizador
            let pageNumber = 1;
            questionIndex = 1; // Resetar o índice de questões ao carregar um novo PDF
            numeros = []; // Limpar arrays de gabarito ao carregar um novo PDF
            letras = [];

            // Função para renderizar uma página
            const renderPage = (pageNum) => {
                pdf.getPage(pageNum).then(page => {
                    const scale = 1.5;
                    const viewport = page.getViewport({ scale });

                    // Criar container para a página
                    const pageContainer = document.createElement('div');
                    pageContainer.className = 'page-container';
                    pdfViewer.appendChild(pageContainer);

                    // Criar canvas para renderização
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    pageContainer.appendChild(canvas);

                    // Centralizar o canvas horizontalmente
                    const canvasOffsetX = (pdfViewer.clientWidth - canvas.width) / 2;
                    canvas.style.marginLeft = `${canvasOffsetX}px`;

                    // Renderizar a página
                    page.render({
                        canvasContext: context,
                        viewport: viewport
                    });

                    // Extrair o texto da página
                    page.getTextContent().then(textContent => {
                        const textItems = textContent.items;

                        // Criar overlay para os radio buttons
                        const overlay = document.createElement('div');
                        overlay.className = 'radio-overlay';
                        pageContainer.appendChild(overlay);

                        // Adicionar radio buttons dinamicamente
                        textItems.forEach(item => {
                            const text = item.str.trim();

                            // Verificar se a linha começa com "a)", "b)", etc.
                            const alternatives = ['a)', 'b)', 'c)', 'd)', 'e)', '(a)', '(b)', '(c)', '(d)', '(e)'];
                            alternatives.forEach(alt => {
                                if (text.toLowerCase().startsWith(alt.toLowerCase())) {
                                    // Cálculo da posição (ajustado para escala)
                                    const x = item.transform[4] * scale + canvasOffsetX - 21;
                                    const y = viewport.height - item.transform[5] * scale - 15;

                                    // Criar radio button
                                    const radio = document.createElement('input');
                                    radio.type = 'radio';
                                    radio.name = `question${questionIndex}`;
                                    radio.value = alt.replace(/[()]/g, '');

                                    // Container para o radio button
                                    const container = document.createElement('div');
                                    container.className = 'radio-container';
                                    container.style.left = `${x}px`;
                                    container.style.top = `${y}px`;
                                    container.appendChild(radio);

                                    overlay.appendChild(container);

                                    // Incrementar o índice após a opção "e)"
                                    if (alt.toLowerCase() === 'e)' || alt.toLowerCase() === '(e)') {
                                        questionIndex++;
                                    }
                                }
                            });
                        });
                    });

                    // Renderizar próxima página (se existir)
                    if (pageNum < pdf.numPages) {
                        pageNumber++;
                        renderPage(pageNumber);
                    }
                };

                renderPage(pageNumber);
            });
        }
    }


    // Botão de resultado - Event listener DENTRO do DOMContentLoaded
    btnResultado.addEventListener("click", pegar_valores);
});
