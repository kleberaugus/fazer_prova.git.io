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
