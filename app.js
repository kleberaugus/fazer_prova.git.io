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

// Aguarde o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
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

    // Função para carregar o PDF
    function loadPDF(data) {
        pdfjsLib.getDocument({ data }).promise.then(pdf => {
            pdfViewer.innerHTML = ''; // Limpar o visualizador
            let pageNumber = 1;
            let questionIndex = 1; // Reinicializar questionIndex aqui

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
                console.log(questionIndex);
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
                });

                // Renderizar próxima página (se existir)
                if (pageNum < pdf.numPages) {
                    pageNumber++;
                    renderPage(pageNumber);
                }
            };

            // Iniciar renderização
            renderPage(pageNumber);
        });
    }

    // Processar texto do gabarito
    const input = document.getElementById("colargabarito");
    input.addEventListener("input", processarTexto);

    // Função para processar o texto
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

        // Adicionar restos
        if (tempNumero) numeros.push(parseInt(tempNumero, 10));
        if (tempLetras) letras.push(...tempLetras.split(''));
    }

    // Botão de resultado
    document.getElementById("btn_resultado").addEventListener("click", pegar_valores);
});
