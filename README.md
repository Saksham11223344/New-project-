<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Do You Have a Crush on Me?</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f0f0f0;
            margin: 0;
            font-family: Arial, sans-serif;
        }
        .container {
            text-align: center;
        }
        .buttons {
            margin-top: 20px;
        }
        .no-button {
            position: absolute;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Do you have a crush on me?</h1>
        <div class="buttons">
            <button onclick="handleYes()">Yes</button>
            <button id="noButton" onclick="handleNo()">No</button>
        </div>
    </div>

    <script>
        function handleYes() {
            window.location.href = 'yes.html';
        }

        function handleNo() {
            const noButton = document.getElementById('noButton');
            const x = Math.random() * (window.innerWidth - noButton.offsetWidth);
            const y = Math.random() * (window.innerHeight - noButton.offsetHeight);
            noButton.style.left = x + 'px';
            noButton.style.top = y + 'px';
        }
    </script>
</body>
</html>
