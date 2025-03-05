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

                    // Criar divs para cada linha de texto
                    textItems.forEach(item => {
                        const div = document.createElement('div');
                        div.textContent = item.str;
                        pdfViewer.appendChild(div);
                    });

                    // Adicionar radio buttons dinamicamente
                    addRadioButtons();
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

// Adicionar radio buttons dinamicamente
function addRadioButtons() {
    const divs = pdfViewer.querySelectorAll('div');
    let questionIndex = 0;

    divs.forEach(div => {
        const text = div.textContent.trim();

        // Verificar se o texto contém alternativas (a), b), c), d), e))
        const alternatives = ['a)', 'b)', 'c)', 'd)', 'e)'];
        alternatives.forEach((alt, index) => {
            if (text.toLowerCase().startsWith(alt.toLowerCase())) {
                // Criar um radio button
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `question${questionIndex}`;
                radio.value = alt[0]; // Valor do radio button (a, b, c, d, e)

                // Criar um label para o radio button
                const label = document.createElement('label');
                label.appendChild(radio);
                label.appendChild(document.createTextNode(text));

                // Criar um container para o radio button e o texto
                const container = document.createElement('div');
                container.className = 'radio-container';
                container.appendChild(label);

                // Substituir o conteúdo da div pelo container
                div.innerHTML = '';
                div.appendChild(container);

                // Se for a primeira alternativa (a)), criar um novo grupo
                if (alt.toLowerCase() === 'a)') {
                    questionIndex++;
                }
            }
        });
    });
}
