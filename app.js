<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Click no botão para carregar o PDF da PROVA</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        #pdf-viewer {
            width: 100%;
            height: 80vh;
            border: 1px solid #ccc;
            overflow-y: auto;
            padding: 10px;
            background: #f9f9f9;
            position: relative;
        }
        .page-container {
            position: relative;
            margin-bottom: 20px;
        }
        .page-container canvas {
            display: block;
            margin: 0 auto;
        }
        .radio-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        .radio-container {
            position: absolute;
            display: flex;
            align-items: center;
        }
        .radio-container input[type="radio"] {
            margin-right: 5px;
        }
    </style>
</head>
<body>
    <h1>Click no botão para carregar o PDF da PROVA</h1>
    <input type="text" placeholder="Cole aqui o gabarito" style="width: 200px; padding: 5px;">

<input type="file" id="pdf-input" accept="application/pdf">
    <div id="pdf-viewer"></div>

    


    <!-- Carregue o script como um módulo -->
    <script type="module" src="app.js"></script>
</body>
</html>

    // Botão de resultado
    document.getElementById("btn_resultado").addEventListener("click", pegar_valores);
});
