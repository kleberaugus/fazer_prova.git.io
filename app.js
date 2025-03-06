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
                const scale = 1.5; // Escala usada para renderizar o PDF
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
                        const alternatives = ['a)', 'b)', 'c)', 'd)', 'e)'];
                        alternatives.forEach(alt => {
                            if (text.toLowerCase().startsWith(alt.toLowerCase())) {
                                // Calcular a posição do texto no canvas (com escala)
                                const x = item.transform[4] * scale + canvasOffsetX; // Ajuste para a escala e deslocamento horizontal
                                const y = (viewport.height - item.transform[5] * scale) - 25; // Inverter o eixo Y, ajustar para a escala e subir um pouco

                                // Criar radio button
                                const radio = document.createElement('input');
                                radio.type = 'radio';
                                radio.name = `question${pageNum}`;
                                radio.value = alt[0];

                                // Criar label para o radio button
                                const label = document.createElement('label');
                                label.appendChild(radio);
                                label.appendChild(document.createTextNode(text));

                                // Criar container para o radio button e o texto
                                const container = document.createElement('div');
                                container.className = 'radio-container';
                                container.style.left = `${x}px`;
                                container.style.top = `${y}px`;
                                container.appendChild(label);

                                // Adicionar ao overlay
                                overlay.appendChild(container);
                            }
                        });
                    });
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
