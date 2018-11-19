var bd = require('./../lib/conexionDb');
bd.connect();

function obtenerCompetencias (req, res) {
	var competencias = []

	var q = 'select * from competencias';

	bd.query(q, (error, results, fields) => {
		if(!error) {
			for(var i=0; i<results.length; i++) {
				competencias.push(results[i]);
			}
			console.log('Se seleccionar todas las competencias');
			res.status(200).send(competencias);
		} else {
			res.status(500).send(error);
		}
	});
}

function obtenerOpciones (req, res) {
	var opciones = {
		competencia: '',
		idGenero: 0,
		idDirector: 0,
		idActor: 0,
		peliculas: []
	};
	var idCompetencia = req.params.id;

	var q = `select * from competencias where id = ?`;

	bd.query(q, [idCompetencia], (error, results, fields) => {
		if(!error) {
			opciones.competencia = results[0].nombre;
			opciones.idGenero = results[0].idGenero;
			opciones.idDirector = results[0].idDirector;
			opciones.idActor = results[0].idActor;

			// pedir peliculas según filtros
			var q2 = filtrarCriterios(opciones);			

			bd.query(q2, (error, results, fields) => {
				if(!error) {
					for(var i=0; i<results.length; i++) {
						opciones.peliculas.push(results[i]);
					}
					console.log('Se obtuvieron 2 opciones aleatorias segun los criterios aplicados');
					res.status(200).send(opciones);
				} else {
					return res.status(500).send(error);
				}
			});			
		} else {
			res.status(500).send(error);
		}
	});
}

function filtrarCriterios (opciones) {
	var q2 = `select pelicula.id, pelicula.poster, pelicula.titulo
			from pelicula`;

			// si tiene filtro genero
			if(opciones.idGenero && !opciones.idDirector && !opciones.idActor) {
				q2 = q2 + ` where pelicula.genero_id = ${opciones.idGenero}`;
			}

			// si tiene filtro director
			if(!opciones.idGenero && opciones.idDirector && !opciones.idActor) {
				q2 = q2 + ` join director_pelicula on director_pelicula.pelicula_id = pelicula.id
					where director_pelicula.director_id = ${opciones.idDirector}`;
			}

			// si tiene filtro actor
			if(!opciones.idGenero && !opciones.idDirector && opciones.idActor) {
				q2 = q2 + ` join actor_pelicula on actor_pelicula.pelicula_id = pelicula.id
					where actor_pelicula.actor_id = ${opciones.idActor}`;
			}

			// si tiene filtros genero y director
			if(opciones.idGenero && opciones.idDirector && !opciones.idActor) {
				q2 = q2 + ` join director_pelicula on director_pelicula.pelicula_id = pelicula.id
					where pelicula.genero_id = ${opciones.idGenero} and director_pelicula.director_id = ${opciones.idDirector}`;
			}

			// si tiene filtros genero y actor
			if(opciones.idGenero && opciones.idDirector && !opciones.idActor) {
				q2 = q2 + ` join actor_pelicula on actor_pelicula.pelicula_id = pelicula.id
					where pelicula.genero_id = ${opciones.idGenero} and actor_pelicula.actor_id = ${opciones.idActor}`;
			}

			// si tiene filtros director y actor
			if(opciones.idGenero && opciones.idDirector && !opciones.idActor) {
				q2 = q2 + ` join director_pelicula on director_pelicula.pelicula_id = pelicula.id
					join actor_pelicula on actor_pelicula.pelicula_id = pelicula.id
					where director_pelicula.director_id = ${opciones.idDirector} and actor_pelicula.actor_id = ${opciones.idActor}`;
			}

			// si tiene filtros genero, director y actor
			if(opciones.idGenero && opciones.idDirector && opciones.idActor) {
				q2 = q2 + ` join director_pelicula on director_pelicula.pelicula_id = pelicula.id
					join actor_pelicula on actor_pelicula.pelicula_id = pelicula.id
					where pelicula.genero_id = ${opciones.idGenero} and director_pelicula.director_id = ${opciones.idDirector} 
					and actor_pelicula.actor_id = ${opciones.idActor}`;
			}

			q2 = q2 + ` order by rand() limit 2`;
			return q2;
}

function votarPelicula (req, res) {
	var idCompetencia = req.params.idCompetencia;
	var idPelicula = req.body.idPelicula;

	// valido los ids que llegan como parametros
	if(!idCompetencia) {
		return res.status(422).send('No se envió el id de la competencia');
	}

	if(!idPelicula) {
		return res.status(422).send('No se envió el id de la pelicula');
	}

	// me fijo si existen en la tabla voto
	var q1 = 'select 1 from voto where idCompetencia = ? and idPelicula = ?';
	bd.query(q1, [idCompetencia, idPelicula], (error, results, fields) => {
		if(!error) {
			if(results.length>0) {
				console.log('Se seleccionar la pelicula votada');
				var q2 = 'update voto set cantVotos = cantVotos + 1 where idCompetencia = ? and idPelicula = ?';
					bd.query(q2, [idCompetencia, idPelicula], (error, results, fields) => {
						if(!error) {
							console.log('Se suma un voto a la pelicula');
							return res.send(results);
						} else {
							return res.send(error);
						}
					});
			} else {
				var q3 = 'insert into voto values (?,?,1)';
				bd.query(q3, [idCompetencia, idPelicula], (error, results, fields) => {
					if(!error) {
						console.log('Se agrega la pelicula votada en la competencia');
						return res.send(results);
					} else {
						return res.status(500).send(error);
					}
				});
			}
		} else {
			return res.status(500).send(error);
		}		
	});
}

function obtenerResultados (req, res) {
	var idCompetencia = req.params.idCompetencia;

	// valido los ids que llegan como parametros
	if(!idCompetencia) {
		return res.status(422).send('No se envió el id de la competencia');
	}

	var resultados = {
		competencia: '',
		resultados: []
	};

	var q = `select voto.idPelicula as pelicula_id, voto.cantVotos as votos, competencias.nombre, pelicula.poster, pelicula.titulo
	from voto join competencias on competencias.id = voto.idCompetencia join pelicula on pelicula.id = voto.idPelicula
	where idCompetencia = ?
	order by voto.cantVotos desc`;
	bd.query(q, [idCompetencia], (error, results, fields) => {
		if(!error) {
			resultados.competencia = results[0].nombre;
			for(var i=0; i<results.length; i++) {
				console.log(results[i]);
				resultados.resultados.push(results[i]);
			};
			console.log('Se obtienen los resultados de la competencia');
			return res.status(200).send(resultados);
		} else {
			return res.status(500).send(error);
		}
	})
}

function cargarGeneros (req, res) {
	var q = 'select * from genero';
	bd.query(q, (error, results, fields) => {
		if(!error) {
			console.log('Se seleccionan los generos');
			res.send(results);
		} else {
			res.status(500).send(error)
		}
	})
}

function cargarDirectores (req, res) {
	var q = 'select * from director';
	bd.query(q, (error, results, fields) => {
		if(!error) {
			console.log('Se seleccionan los directores');
			res.send(results);
		} else {
			res.status(500).send(error)
		}
	})
}

function cargarActores (req, res) {
	var q = 'select * from actor';
	bd.query(q, (error, results, fields) => {
		if(!error) {
			console.log('Se seleccionan los actores');
			res.send(results);
		} else {
			res.status(500).send(error)
		}
	})
}

function crearCompetencia (req, res) {
	var competencia = req.body;

	// valido si llega la competencia
	if(!competencia) {
		return res.status(422).send('No se envió la competencia');
	}

	var q = 'insert into competencias (nombre, idGenero, idDirector, idActor) values(?, ?, ?, ?)';
	bd.query(q, [competencia.nombre, competencia.genero, competencia.director, competencia.actor], (error, results, fields) => {
		if(!error) {
			console.log('Se crea una competencia');
			return res.send(results);
		} else {
			return res.status(500).send(error)
		}
	});
}

function obtenerCompetencia (req, res) {
	var idCompetencia = req.params.idCompetencia;

	// valido los ids que llegan como parametros
	if(!idCompetencia) {
		return res.status(422).send('No se envió el id de la competencia');
	}

	var q = `select competencias.nombre, genero.nombre as genero_nombre,
	director.nombre as director_nombre, actor.nombre as actor_nombre
	from competencias join genero on genero.id = competencias.idGenero join
	director on director.id = competencias.idDirector join actor on actor.id = competencias.idActor 
	where competencias.id = ?`;
	bd.query(q, [idCompetencia], (error, results, fields) => {
		console.log(results);
		if(!error) {
			console.log('Se obtiene una competencia');
			return res.send(results[0]);
		} else {
			return res.status(500).send(error);
		}
	});
}

function reiniciarCompetencia (req, res) {
	var idCompetencia = req.params.idCompetencia;

	// valido los ids que llegan como parametros
	if(!idCompetencia) {
		return res.status(422).send('No se envió el id de la competencia');
	}


	var q = 'update voto set cantVotos = 0 where idCompetencia = ?';
	bd.query(q, [idCompetencia], (error, results, fields) => {
		if(!error) {
			console.log('Se reinicia una competencia');
			return res.send(results[0]);
		} else {
			res.status(500).send(error);
		}
	});
}

function editarCompetencia (req, res) {
	var idCompetencia = req.params.idCompetencia;
	var nombre = req.body.nombre;

	// valido los ids que llegan como parametros
	if(!idCompetencia) {
		return res.status(422).send('No se envió el id de la competencia');
	}

	// valido que llegue un nombre para cambiar
	if(!nombre) {
		return res.status(422).send('No se envió el nombre de la competencia');
	}


	var q = 'update competencias set nombre = ? where id = ?';
	bd.query(q, [nombre, idCompetencia], (error, results, fields) => {
		if(!error) {
			console.log('Se edita una competencia');
			return res.send(results[0]);
		} else {
			return res.status(500).send(error);
		}
	});
}

function eliminarCompetencia (req, res) {
	var idCompetencia = req.params.idCompetencia;

	// valido los ids que llegan como parametros
	if(!idCompetencia) {
		return res.status(422).send('No se envió el id de la competencia');
	}
	
	var q = 'delete from competencias where id = ?';
	bd.query(q, [idCompetencia], (error, results, fields) => {
		if(!error) {
			console.log('Se elimina una competencia');
			return res.send(results[0]);
		} else {
			return res.status(500).send(error);
		}
	});
}

module.exports = {
	obtenerCompetencias,
	obtenerOpciones,
	votarPelicula,
	obtenerResultados,
	cargarGeneros,
	cargarDirectores,
	cargarActores,
	crearCompetencia,
	obtenerCompetencia,
	reiniciarCompetencia,
	editarCompetencia,
	eliminarCompetencia
};