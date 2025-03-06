// Importe o PDF.js no topo do arquivo (nível superior do módulo)
import * as pdfjsLib from './pdfjs/pdf.mjs';

// Configuração do worker (também no topo)
pdfjsLib.GlobalWorkerOptions.workerSrc = './pdfjs/pdf.worker.mjs';

// Função para coletar valores dos radios (fora do DOMContentLoaded)
window.pegar_valores = function() {
    const grupos = {};
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        if (!grupos[radio.name]) grupos[radio.name] = "";
        if (radio.checked) grupos[radio.name] = radio.value;
    });
    alert(Object.values(grupos));
};

document.addEventListener('DOMContentLoaded', () => {
    const pdfInput = document.getElementById('pdf-input');
    const pdfViewer = document.getElementById('pdf-viewer');

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

    // Variável global para numerar as questões
    let questionIndex = 1;

    function loadPDF(data) {
        pdfjsLib.getDocument({ data }).promise.then(pdf => {
            pdfViewer.innerHTML = ''; // Limpa o visualizador
            let pageNumber = 1;

            // Função para renderizar uma página
            const renderPage = (pageNum) => {
                pdf.getPage(pageNum).then(page => {
                    const scale = 1.5;
                    const viewport = page.getViewport({ scale });

                    // Cria container para a página
                    const pageContainer = document.createElement('div');
                    pageContainer.className = 'page-container';
                    pdfViewer.appendChild(pageContainer);

                    // Cria canvas para renderização
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    pageContainer.appendChild(canvas);

                    // Centraliza o canvas horizontalmente
                    const canvasOffsetX = (pdfViewer.clientWidth - canvas.width) / 2;
                    canvas.style.marginLeft = `${canvasOffsetX}px`;

                    // Renderiza a página
                    page.render({
                        canvasContext: context,
                        viewport: viewport
                    });

                    // Extrai o texto da página
                    page.getTextContent().then(textContent => {
                        const textItems = textContent.items;
                        const candidates = [];

                        // Regex para identificar alternativas: "a)", "(a)", etc.
                        const altRegex = /^(\(?[a-e]\)?)/i;
                        textItems.forEach(item => {
                            const text = item.str.trim();
                            const match = text.match(altRegex);
                            if (match) {
                                // Extrai a letra removendo parênteses
                                const letter = match[1].replace(/[()]/g, '').toLowerCase();
                                // Calcula posição (ajustando para a escala e deslocamento do canvas)
                                const x = item.transform[4] * scale + canvasOffsetX - 21;
                                const y = viewport.height - item.transform[5] * scale - 15;
                                candidates.push({ letter, x, y, originalText: text });
                            }
                        });

                        // Ordena os candidatos de cima para baixo e, em caso de empate, da esquerda para a direita
                        candidates.sort((a, b) => {
                            if (a.y === b.y) {
                                return a.x - b.x;
                            }
                            return a.y - b.y;
                        });

                        // Agrupa os candidatos em questões.
                        // Se o item for "a" ou se a distância vertical do item atual em relação
                        // ao anterior for maior que um limiar (ex.: 30px), inicia um novo grupo.
                        const groups = [];
                        let currentGroup = [];
                        const yThreshold = 30; // Pode ser ajustado conforme necessário

                        candidates.forEach(candidate => {
                            if (
                                candidate.letter === 'a' ||
                                (currentGroup.length > 0 && (candidate.y - currentGroup[currentGroup.length - 1].y > yThreshold))
                            ) {
                                if (currentGroup.length > 0) {
                                    groups.push(currentGroup);
                                }
                                currentGroup = [candidate];
                            } else {
                                currentGroup.push(candidate);
                            }
                        });
                        if (currentGroup.length > 0) {
                            groups.push(currentGroup);
                        }

                        // Cria overlay para os radio buttons
                        const overlay = document.createElement('div');
                        overlay.className = 'radio-overlay';
                        pageContainer.appendChild(overlay);

                        // Para cada grupo (questão), cria os radio buttons com o mesmo name
                        groups.forEach(group => {
                            const currentQuestionName = `question${questionIndex++}`;
                            group.forEach(candidate => {
                                const radio = document.createElement('input');
                                radio.type = 'radio';
                                radio.name = currentQuestionName;
                                radio.value = candidate.letter;

                                const container = document.createElement('div');
                                container.className = 'radio-container';
                                container.style.left = `${candidate.x}px`;
                                container.style.top = `${candidate.y}px`;
                                container.appendChild(radio);

                                overlay.appendChild(container);
                            });
                        });
                    });
                });

                // Renderiza a próxima página (se existir)
                if (pageNum < pdf.numPages) {
                    renderPage(pageNum + 1);
                }
            };

            renderPage(pageNumber);
        });
    }

    // Processar texto do gabarito
    const input = document.getElementById("colargabarito");
    input.addEventListener("input", processarTexto);

    function processarTexto() {
        let texto = input.value;
        let numeros = [];
        let letras = [];
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
        if (tempNumero) numeros.push(parseInt(tempNumero, 10));
        if (tempLetras) letras.push(...tempLetras.split(''));
    }

    document.getElementById("btn_resultado").addEventListener("click", pegar_valores);
});
