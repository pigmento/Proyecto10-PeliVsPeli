require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const puerto = 8080;

const ctrlCompetencias = require('./controladores/competenciasController')

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({
	'extended': true
}));

app.use(bodyParser.json());

app.get('/', (req, res) => { res.json({ 'saludo': 'hola' });});

app.get('/competencias', ctrlCompetencias.obtenerCompetencias);
app.post('/competencias', ctrlCompetencias.crearCompetencia);
app.get('/competencias/:idCompetencia', ctrlCompetencias.obtenerCompetencia);
app.put('/competencias/:idCompetencia', ctrlCompetencias.editarCompetencia);
app.delete('/competencias/:idCompetencia', ctrlCompetencias.eliminarCompetencia);
app.get('/competencias/:id/peliculas', ctrlCompetencias.obtenerOpciones);
app.post('/competencias/:idCompetencia/voto', ctrlCompetencias.votarPelicula);
app.get('/competencias/:idCompetencia/resultados', ctrlCompetencias.obtenerResultados);
app.get('/generos', ctrlCompetencias.cargarGeneros);
app.get('/directores', ctrlCompetencias.cargarDirectores);
app.get('/actores', ctrlCompetencias.cargarActores);
app.delete('/competencias/:idCompetencia/votos', ctrlCompetencias.reiniciarCompetencia);

app.listen(puerto, () => {
	console.log(`Escuchando en el puerto ${puerto}`);
});