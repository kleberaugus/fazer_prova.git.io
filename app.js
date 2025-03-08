// app.js
import * as pdfjsLib from './pdfjs/pdf.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = './pdfjs/pdf.worker.mjs';

let questionIndex = 1;
let numeros = [];
let letras = [];

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

    const respostasUsuario = {};
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        if (radio.checked) {
            respostasUsuario[radio.name] = radio.value.toLowerCase();
        }
    });

    let pontuacao = 0;
    let totalAcertos = 0;
    let totalQuestoes = 0;
    const detalhesQuestoes = [];
    const configuracaoPesos = obterConfiguracaoPesos();

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
};

// Restante do código permanece igual (processarTexto, event listeners, etc.)
// ...
