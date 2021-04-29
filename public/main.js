function updateToken() {
    let token = document.getElementById("token").value;
    if (token == "") {
        alert("Plese insert a token!")
        return;
    };
    document.getElementById("token").value = "";
    fetch('api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token
            }),
        })
        .then(response => response.json())
        .then(json => {
            refreshValue();
            alert("Token Updated");
        })

}

function refreshValue() {
    fetch("api/isTokenValidForIp")
        .then(response => response.json())
        .then(json => {
            document.getElementById("tokenValid").innerHTML = json.isValid ? "YES" : "NO";
        });
    fetch("api/serverIp")
        .then(response => response.json())
        .then(json => document.getElementById("serverIp").innerHTML = json.ip);

}

function fetchGameData() {
    fetch("api/triggerCocApiTo")
    .then(response => response.json())
    .then(json => {
        alert("DB Update happend");
        console.log(json);
    });
}

refreshValue()