// Importe o PDF.js
import * as pdfjsLib from './pdfjs/pdf.mjs';

// Configuração do worker
pdfjsLib.GlobalWorkerOptions.workerSrc = './pdfjs/pdf.worker.mjs';

// Elementos da interface
const pdfInput = document.getElementById('pdf-input');
const pdfViewer = document.getElementById('pdf-viewer');

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

// Carregar o PDF
function loadPDF(data) {
    pdfjsLib.getDocument({ data }).promise.then(pdf => {
        pdfViewer.innerHTML = ''; // Limpar o visualizador
        let pageNumber = 1;

        // Função para renderizar uma página
        const renderPage = (pageNum) => {
            pdf.getPage(pageNum).then(page => {
                const scale = 1.5;
                const viewport = page.getViewport({ scale });

                // Criar canvas para renderização
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                pdfViewer.appendChild(canvas);

                // Renderizar a página
                page.render({
                    canvasContext: context,
                    viewport: viewport
                });

                // Extrair o texto da página
                page.getTextContent().then(textContent => {
                    const textItems = textContent.items;
                    const textLines = [];

                    // Agrupar texto por coordenadas Y (linhas)
                    let currentLine = '';
                    let currentY = null;

                    textItems.forEach(item => {
                        const y = item.transform[5];
                        if (currentY !== y) {
                            if (currentLine) textLines.push(currentLine);
                            currentLine = item.str;
                            currentY = y;
                        } else {
                            currentLine += item.str;
                        }
                    });
                    if (currentLine) textLines.push(currentLine);

                    // Processar as linhas para encontrar alternativas
                    processLines(textLines);
                });

                // Renderizar a próxima página, se houver
                if (pageNum < pdf.numPages) {
                    pageNumber++;
                    renderPage(pageNumber);
                }
            });
        };

        // Começar a renderização pela primeira página
        renderPage(pageNumber);
    });
}

// Processar as linhas de texto para encontrar alternativas
function processLines(lines) {
    let questionIndex = 0;
    let i = 0;

    while (i < lines.length) {
        // Verificar se a linha atual começa com "a)"
        if (lines[i].trim().startsWith('a)')) {
            // Procurar as próximas alternativas (b), c), d), e))
            const alternatives = ['a)', 'b)', 'c)', 'd)', 'e)'];
            const foundAlternatives = [];

            // Verificar as próximas linhas para encontrar as alternativas
            for (let j = i; j < lines.length; j++) {
                const line = lines[j].trim();
                if (alternatives.some(alt => line.startsWith(alt))) {
                    foundAlternatives.push(line);
                    if (foundAlternatives.length === 5) break; // Todas as alternativas encontradas
                }
            }

            // Se todas as alternativas forem encontradas, criar os radio buttons
            if (foundAlternatives.length === 5) {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'question';
                questionDiv.innerHTML = `
                    <label><input type="radio" name="question${questionIndex}" value="a"> ${foundAlternatives[0]}</label>
                    <label><input type="radio" name="question${questionIndex}" value="b"> ${foundAlternatives[1]}</label>
                    <label><input type="radio" name="question${questionIndex}" value="c"> ${foundAlternatives[2]}</label>
                    <label><input type="radio" name="question${questionIndex}" value="d"> ${foundAlternatives[3]}</label>
                    <label><input type="radio" name="question${questionIndex}" value="e"> ${foundAlternatives[4]}</label>
                `;
                pdfViewer.appendChild(questionDiv);

                // Avançar para a próxima questão
                i += foundAlternatives.length;
                questionIndex++;
            } else {
                // Se não encontrar todas as alternativas, pular para a próxima linha
                i++;
            }
        } else {
            // Se não for uma questão, exibir a linha normalmente
            const lineDiv = document.createElement('div');
            lineDiv.textContent = lines[i];
            pdfViewer.appendChild(lineDiv);
            i++;
        }
    }
}
