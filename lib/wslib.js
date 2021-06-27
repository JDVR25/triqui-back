const WebSocket = require("ws");
const { v4: uuidv4 } = require('uuid');
const Mongolib = require("./Mongolib");

var enEspera = null;
var cruz = {};
var circulo = {};
const tabInicial = [["", "", ""], ["", "", ""], ["", "", ""]];

/*Retorna "" si no hay un ganador todavia, Cruz o Circulo si ya hay un ganador y draw si hay un empate*/
const verificarGanador = (tablero) => {
  var res = "";
  var nuevoGanador = "";
  for (var i = 0; i < 3 && !nuevoGanador; i++) {
    if (tablero[i][0] && tablero[i][0] === tablero[i][1] && tablero[i][1] === tablero[i][2]) {
      nuevoGanador = tablero[i][0];
    }
    else if (tablero[0][i] && tablero[0][i] === tablero[1][i] && tablero[1][i] === tablero[2][i]) {
      nuevoGanador = tablero[0][i];
    }
  };
  if (tablero[0][0] && tablero[0][0] === tablero[1][1] && tablero[1][1] === tablero[2][2]) {
    nuevoGanador = tablero[0][0];
  }
  else if (tablero[0][2] && tablero[0][2] === tablero[1][1] && tablero[1][1] === tablero[2][0]) {
    nuevoGanador = tablero[0][2];
  }
  if (nuevoGanador) {
    res = nuevoGanador;
  }
  else {
    var draw = true;
    for (var f = 0; f < 3 && draw; f++) {
      for (var c = 0; c < 3 && draw; c++) {
        draw = draw && tablero[f][c];
      };
    };
    if (draw) {
      res = "draw";
    }
  }
  return res;
}


const wsConnection = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    if (!enEspera) {
      enEspera = ws;
      var msg = {
        tipo: "espera"
      };
      ws.send(JSON.stringify(msg));
    }
    else {
      var temp = enEspera;
      enEspera = null;
      var identificador = uuidv4();
      if ((Math.random() * 10) > 5) {
        cruz[identificador] = temp;
        circulo[identificador] = ws;
        var msgCruz = {
          tipo: "inicio",
          ficha: "Cruz",
          tablero: tabInicial,
          idJuego: identificador,
          turno: "Cruz"
        };
        var msgCirculo = {
          tipo: "inicio",
          ficha: "Circulo",
          tablero: tabInicial,
          idJuego: identificador,
          turno: "Cruz"
        };
        temp.send(JSON.stringify(msgCruz))
        ws.send(JSON.stringify(msgCirculo))
      }
      else {
        circulo[identificador] = temp;
        cruz[identificador] = ws;
        var msgCruz = {
          tipo: "inicio",
          ficha: "Cruz",
          tablero: tabInicial,
          idJuego: identificador,
          turno: "Cruz"
        };
        var msgCirculo = {
          tipo: "inicio",
          ficha: "Circulo",
          tablero: tabInicial,
          idJuego: identificador,
          turno: "Cruz"
        };
        temp.send(JSON.stringify(msgCirculo))
        ws.send(JSON.stringify(msgCruz))
      }
    }


    ws.on("message", (message) => {
      var jsonMsg = JSON.parse(message);
      var resultados = verificarGanador(jsonMsg.tablero);
      var respuesta= {};
      if(resultados === "draw")
      {
        respuesta = {
          idJuego: jsonMsg.idJuego,
          tipo: "terminacion",
          resultado: "empate",
          tablero: jsonMsg.tablero
        };
        cruz[jsonMsg.idJuego].send(JSON.stringify(respuesta));
        circulo[jsonMsg.idJuego].send(JSON.stringify(respuesta));

        cruz[jsonMsg.idJuego].close();
        circulo[jsonMsg.idJuego].close();

        var documento = {
          idEncuentro: jsonMsg.idJuego,
          resultado: "empate",
          tableroFinal: jsonMsg.tablero,
          ganador: "ninguno"
        }
        Mongolib.insertMatch(documento, (docs) =>{})

        delete cruz[jsonMsg.idJuego];
        delete circulo[jsonMsg.idJuego]
      }
      else if(resultados)
      {
        respuesta = {
          idJuego: jsonMsg.idJuego,
          tipo: "terminacion",
          resultado: "victoria",
          tablero: jsonMsg.tablero,
          ganador: resultados
        };
        cruz[jsonMsg.idJuego].send(JSON.stringify(respuesta));
        circulo[jsonMsg.idJuego].send(JSON.stringify(respuesta));

        var documento = {
          idEncuentro: jsonMsg.idJuego,
          resultado: "victoria",
          tableroFinal: jsonMsg.tablero,
          ganador: resultados
        }
        Mongolib.insertMatch(documento, (docs) =>{})

        delete cruz[jsonMsg.idJuego];
        delete circulo[jsonMsg.idJuego]
      }
      else{
        var newTurn = jsonMsg.turno === "Cruz"? "Circulo": "Cruz"
        respuesta = {
          idJuego: jsonMsg.idJuego,
          tipo: "movimiento",
          tablero: jsonMsg.tablero,
          turno: newTurn
        };
        if(newTurn === "Cruz")
        {
          cruz[jsonMsg.idJuego].send(JSON.stringify(respuesta));
        }
        else{
          circulo[jsonMsg.idJuego].send(JSON.stringify(respuesta));
        }
      }

    });
  });
};

exports.wsConnection = wsConnection;