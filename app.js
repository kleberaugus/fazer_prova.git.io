// app.js
import * as pdfjsLib from './pdfjs/pdf.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = './pdfjs/pdf.worker.mjs';
//now123
let questionIndex = 1;
let numeros = [];
let letras = [];
let respostasUsuario = {}; // Mova a declaração para fora da função pegar_valores

// Função para exibir o modal com resultados
function mostrarModal(resumoHTML, detalhesHTML) {
    const modal = document.getElementById('resultadoModal');
    const resumoDiv = document.getElementById('resumo');
    const detalhesDiv = document.getElementById('detalhes');
    
    resumoDiv.innerHTML = resumoHTML;
    detalhesDiv.innerHTML = detalhesHTML;
    
    modal.style.display = 'block';

    // Fechar modal ao clicar no X
    document.getElementsByClassName('close')[0].onclick = function() {
        modal.style.display = 'none';
    }

    // Fechar modal ao clicar fora
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}


window.pegar_valores = function() {
    if (numeros.length === 0 || letras.length === 0) {
        alert("Por favor, cole o gabarito na caixa de texto");
        return;
    }

    respostasUsuario = {}; // Inicializar respostasUsuario aqui
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        if (radio.checked) {
            respostasUsuario[radio.name] = radio.value.toLowerCase();
        }
    });

    let pontuacao = 0;
    let totalAcertos = 0;
    let totalQuestoes = 0;
    const configuracaoPesos = window.obterConfiguracaoPesos ? window.obterConfiguracaoPesos() : [{ inicio: 1, fim: 1000, peso: 1 }];

    for (let i = 0; i < numeros.length; i++) {
        const numeroQuestao = numeros[i];
        const respostaCorreta = letras[i].toLowerCase();
        const nomeQuestao = `question${numeroQuestao}`;
        let pesoQuestao = 1;
        totalQuestoes++;

        for (const grupo of configuracaoPesos) {
            if (numeroQuestao >= grupo.inicio && numeroQuestao <= grupo.fim) {
                pesoQuestao = grupo.peso;
                break;
            }
        }

        const respostaUsuario = respostasUsuario[nomeQuestao] || 'Não respondida';
        const acertou = respostaUsuario === respostaCorreta;

        if (acertou) {
            pontuacao += pesoQuestao;
            totalAcertos++;
        }

        detalhesQuestoes.push({
            numero: numeroQuestao,
            correta: respostaCorreta.toUpperCase(),
            usuario: respostaUsuario.toUpperCase(),
            acertou: acertou,
            peso: pesoQuestao
        });
    }

    // Gerar HTML do resumo
    const resumoHTML = `
        <h3>Resumo:</h3>
        <p>Acertos: ${totalAcertos} de ${totalQuestoes} questões</p>
        <p>Pontuação Total: ${pontuacao}</p>
    `;

    // Gerar HTML da tabela detalhada
    let detalhesHTML = `
        <h3>Detalhamento por questão:</h3>
        <table>
            <tr>
                <th>Questão</th>
                <th>Resposta Correta</th>
                <th>Sua Resposta</th>
                <th>Status</th>
                <th>Peso</th>
            </tr>
    `;

    detalhesQuestoes.forEach(questao => {
        detalhesHTML += `
            <tr class="${questao.acertou ? 'correct' : 'incorrect'}">
                <td>${questao.numero}</td>
                <td>${questao.correta}</td>
                <td>${questao.usuario}</td>
                <td>${questao.acertou ? '✔' : '✖'}</td>
                <td>${questao.peso}</td>
            </tr>
        `;
    });

    detalhesHTML += '</table>';

    mostrarModal(resumoHTML, detalhesHTML);
    adicionarFeedbackVisual(detalhesQuestoes); // Adicionar feedback visual ao PDF
};

function adicionarFeedbackVisual(detalhesQuestoes) {
    const radioOverlays = document.querySelectorAll('.radio-overlay');
    radioOverlays.forEach(overlay => {
        const pageContainer = overlay.parentElement;
        const feedbackOverlay = document.createElement('div');
        feedbackOverlay.className = 'feedback-overlay';
        pageContainer.appendChild(feedbackOverlay);
    });

    // Criar um mapeamento entre números de questões e nomes de inputs
    const numeroParaNome = {};
    numeros.forEach((numero, index) => {
        numeroParaNome[numero] = `question${numero}`;
    });

    detalhesQuestoes.forEach(questao => {
        const nomeQuestao = numeroParaNome[questao.numero]; // Usar o mapeamento
        const respostaUsuario = respostasUsuario[nomeQuestao] || 'Não respondida';
        const radioContainers = document.querySelectorAll(`input[name="${nomeQuestao}"]`);

        radioContainers.forEach(radio => {
            const radioContainer = radio.parentElement;
            const x = parseInt(radioContainer.style.left);
            const y = parseInt(radioContainer.style.top);
            const feedbackOverlay = radioContainer.parentElement.parentElement.querySelector('.feedback-overlay');
            if (radio.value.toLowerCase() === questao.correta.toLowerCase()) {
                radioContainer.classList.add('correct-answer');
                const icon = document.createElement('span');
                icon.className = `feedback-icon correct-icon`;
                icon.textContent = '✔';
                icon.style.left = `${x-15}px`;
                icon.style.top = `${y}px`;
                feedbackOverlay.appendChild(icon);
            } else if (radio.value.toLowerCase() === respostaUsuario.toLowerCase() && !questao.acertou) {
                radioContainer.classList.add('incorrect-answer');
                const icon = document.createElement('span');
                icon.className = `feedback-icon incorrect-icon`;
                icon.textContent = '✖';
                icon.style.left = `${x-15}px`;
                icon.style.top = `${y}px`;
                feedbackOverlay.appendChild(icon);
            }
        });
    });
}

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

    inputGabarito.addEventListener("input", function() {
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
        let gabaritoIndex = 0; // Índice para percorrer os números do gabarito

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
                                radio.name = `question${numeros[gabaritoIndex]}`;
                                radio.value = alt.replace(/[()]/g, '');

                                const container = document.createElement('div');
                                container.className = 'radio-container';
                                container.style.left = `${x}px`;
                                container.style.top = `${y}px`;
                                container.appendChild(radio);

                                overlay.appendChild(container);

                                if (alt.toLowerCase() === 'e)' || alt.toLowerCase() === '(e)') {
                                    gabaritoIndex++;
                                }
                               } 
                            })
                        });
                    });
                    

                    if (pageNum < pdf.numPages) {
                        renderPage(pageNum + 1);
                    }
                
           });
      });      

        renderPage(pageNumber);
    }); // <-- Essa chave finaliza corretamente o `pdfjsLib.getDocument`
} // <-- Essa chave finaliza `loadPDF`
});
