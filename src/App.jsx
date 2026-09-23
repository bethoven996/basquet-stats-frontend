import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORES_TIROS = ["#E8631C", "#4FA184", "#C68E4E"];
const COLORES_COMPARAR = ["#E8631C", "#7C5CFC", "#4FA184"];
const POSICIONES = ["base", "escolta", "alero", "ala-pivot", "pivot"];
const MAX_COMPARAR = 3;

const JUGADOR_VACIO = {
  nombre: "",
  equipo_id: "",
  posicion: "base",
  dorsal: "",
  altura_cm: "",
  peso_kg: "",
  edad: "",
  puntos: "",
  rebotes: "",
  asistencias: "",
  robos: "",
  perdidas: "",
  tiros_intentados: "",
  tiros_convertidos: "",
  minutos_jugados: "",
};

function App() {
  const [jugadores, setJugadores] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [equipoFiltro, setEquipoFiltro] = useState("");
  const [posicionFiltro, setPosicionFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoJugador, setNuevoJugador] = useState(JUGADOR_VACIO);
  const [fotoNuevoJugador, setFotoNuevoJugador] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [paraComparar, setParaComparar] = useState([]);
  const [modalComparar, setModalComparar] = useState(false);
  const [paraCompararEquipos, setParaCompararEquipos] = useState([]);
  const [modalCompararEquipos, setModalCompararEquipos] = useState(false);

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [modalLogin, setModalLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [logueando, setLogueando] = useState(false);
  const [modalCrearUsuario, setModalCrearUsuario] = useState(false);
  const [modalPartido, setModalPartido] = useState(false);
  const [nuevoPartido, setNuevoPartido] = useState({
    fecha: "",
    equipo_local_id: "",
    equipo_visitante_id: "",
    resultado_local: "",
    resultado_visitante: "",
  });
  const [guardandoPartido, setGuardandoPartido] = useState(false);
  const [errorPartido, setErrorPartido] = useState("");
  const [nuevoUsuarioForm, setNuevoUsuarioForm] = useState({
    username: "",
    password: "",
  });
  const [errorCrearUsuario, setErrorCrearUsuario] = useState("");
  const [exitoCrearUsuario, setExitoCrearUsuario] = useState("");
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  const porPagina = 50;

  useEffect(() => {
    cargarJugadores();

    axios
      .get("http://localhost:8000/equipos")
      .then((response) => setEquipos(response.data))
      .catch((error) => console.error("Error trayendo equipos:", error));

    cargarEstadisticas();

    axios
      .get("http://localhost:8000/partidos")
      .then((response) => setPartidos(response.data))
      .catch((error) => console.error("Error trayendo partidos:", error));
  }, []);

  const headerAuth = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  const cargarJugadores = () => {
    axios
      .get("http://localhost:8000/jugadores")
      .then((response) => setJugadores(response.data))
      .catch((error) => console.error("Error trayendo jugadores:", error));
  };

  const cargarEstadisticas = () => {
    axios
      .get("http://localhost:8000/estadisticas")
      .then((response) => setEstadisticas(response.data))
      .catch((error) => console.error("Error trayendo estadísticas:", error));
  };

  const nombreEquipo = (equipoId) => {
    const equipo = equipos.find((e) => e.id === equipoId);
    return equipo ? equipo.nombre : equipoId;
  };

  const avatarUrl = (jugador) => {
    if (jugador.foto_url) return jugador.foto_url;
    const seed = encodeURIComponent(jugador.nombre);
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=E8631C,4FA184,C68E4E`;
  };

  const abrirLogin = () => {
    setLoginForm({ username: "", password: "" });
    setLoginError("");
    setModalLogin(true);
  };

  const iniciarSesion = () => {
    if (!loginForm.username || !loginForm.password) {
      setLoginError("Completá usuario y contraseña.");
      return;
    }
    setLogueando(true);
    setLoginError("");

    axios
      .post("http://localhost:8000/login", loginForm)
      .then((response) => {
        const nuevoToken = response.data.access_token;
        localStorage.setItem("token", nuevoToken);
        setToken(nuevoToken);
        setModalLogin(false);
        setLogueando(false);
      })
      .catch(() => {
        setLoginError("Usuario o contraseña incorrectos.");
        setLogueando(false);
      });
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    setToken(null);
  };
  const abrirModalPartido = () => {
    if (!token) {
      abrirLogin();
      return;
    }
    setNuevoPartido({
      fecha: "",
      equipo_local_id: "",
      equipo_visitante_id: "",
      resultado_local: "",
      resultado_visitante: "",
    });
    setErrorPartido("");
    setModalPartido(true);
  };

  const actualizarCampoPartido = (campo, valor) => {
    setNuevoPartido((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardarPartido = () => {
    const {
      fecha,
      equipo_local_id,
      equipo_visitante_id,
      resultado_local,
      resultado_visitante,
    } = nuevoPartido;

    if (!fecha || !equipo_local_id || !equipo_visitante_id) {
      setErrorPartido(
        "Fecha, equipo local y equipo visitante son obligatorios.",
      );
      return;
    }
    if (equipo_local_id === equipo_visitante_id) {
      setErrorPartido("El equipo local y el visitante no pueden ser el mismo.");
      return;
    }

    setGuardandoPartido(true);
    setErrorPartido("");

    const payload = {
      fecha,
      equipo_local_id: Number(equipo_local_id),
      equipo_visitante_id: Number(equipo_visitante_id),
      resultado_local: resultado_local ? Number(resultado_local) : null,
      resultado_visitante: resultado_visitante
        ? Number(resultado_visitante)
        : null,
    };

    axios
      .post("http://localhost:8000/partidos", payload, headerAuth())
      .then(() => {
        axios
          .get("http://localhost:8000/partidos")
          .then((response) => setPartidos(response.data));
        setGuardandoPartido(false);
        setModalPartido(false);
      })
      .catch((error) => {
        console.error("Error creando partido:", error);
        if (error.response?.status === 401) {
          setErrorPartido("Tu sesión expiró. Volvé a iniciar sesión.");
          cerrarSesion();
        } else {
          setErrorPartido("No se pudo guardar el partido.");
        }
        setGuardandoPartido(false);
      });
  };
  const crearUsuario = () => {
    const abrirModalPartido = () => {
      if (!token) {
        abrirLogin();
        return;
      }
      setNuevoPartido({
        fecha: "",
        equipo_local_id: "",
        equipo_visitante_id: "",
        resultado_local: "",
        resultado_visitante: "",
      });
      setErrorPartido("");
      setModalPartido(true);
    };

    const actualizarCampoPartido = (campo, valor) => {
      setNuevoPartido((prev) => ({ ...prev, [campo]: valor }));
    };

    const guardarPartido = () => {
      const {
        fecha,
        equipo_local_id,
        equipo_visitante_id,
        resultado_local,
        resultado_visitante,
      } = nuevoPartido;

      if (!fecha || !equipo_local_id || !equipo_visitante_id) {
        setErrorPartido(
          "Fecha, equipo local y equipo visitante son obligatorios.",
        );
        return;
      }
      if (equipo_local_id === equipo_visitante_id) {
        setErrorPartido(
          "El equipo local y el visitante no pueden ser el mismo.",
        );
        return;
      }

      setGuardandoPartido(true);
      setErrorPartido("");

      const payload = {
        fecha,
        equipo_local_id: Number(equipo_local_id),
        equipo_visitante_id: Number(equipo_visitante_id),
        resultado_local: resultado_local ? Number(resultado_local) : null,
        resultado_visitante: resultado_visitante
          ? Number(resultado_visitante)
          : null,
      };

      axios
        .post("http://localhost:8000/partidos", payload, headerAuth())
        .then(() => {
          axios
            .get("http://localhost:8000/partidos")
            .then((response) => setPartidos(response.data));
          setGuardandoPartido(false);
          setModalPartido(false);
        })
        .catch((error) => {
          console.error("Error creando partido:", error);
          if (error.response?.status === 401) {
            setErrorPartido("Tu sesión expiró. Volvé a iniciar sesión.");
            cerrarSesion();
          } else {
            setErrorPartido("No se pudo guardar el partido.");
          }
          setGuardandoPartido(false);
        });
    };
    if (!nuevoUsuarioForm.username || !nuevoUsuarioForm.password) {
      setErrorCrearUsuario("Completá usuario y contraseña.");
      return;
    }
    setCreandoUsuario(true);
    setErrorCrearUsuario("");
    setExitoCrearUsuario("");

    axios
      .post("http://localhost:8000/usuarios", nuevoUsuarioForm, headerAuth())
      .then(() => {
        setExitoCrearUsuario(`Usuario "${nuevoUsuarioForm.username}" creado.`);
        setNuevoUsuarioForm({ username: "", password: "" });
        setCreandoUsuario(false);
      })
      .catch((error) => {
        setErrorCrearUsuario(
          error.response?.data?.detail || "No se pudo crear el usuario.",
        );
        setCreandoUsuario(false);
      });
  };

  const subirFoto = (jugadorId, archivo) => {
    const formData = new FormData();
    formData.append("foto", archivo);
    setSubiendoFoto(true);

    return axios
      .post(`http://localhost:8000/jugadores/${jugadorId}/foto`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        cargarJugadores();
        setSubiendoFoto(false);
      })
      .catch((error) => {
        console.error("Error subiendo foto:", error);
        setSubiendoFoto(false);
      });
  };

  const abrirModalNuevoJugador = () => {
    if (!token) {
      abrirLogin();
      return;
    }
    setNuevoJugador(JUGADOR_VACIO);
    setFotoNuevoJugador(null);
    setErrorForm("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
  };

  const actualizarCampo = (campo, valor) => {
    setNuevoJugador((prev) => ({ ...prev, [campo]: valor }));
  };

  const ultimoPartidoDelEquipo = (equipoId) => {
    const partidosDelEquipo = partidos.filter(
      (p) =>
        p.equipo_local_id === equipoId || p.equipo_visitante_id === equipoId,
    );
    if (partidosDelEquipo.length === 0) return null;
    return partidosDelEquipo.sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha),
    )[0];
  };

  const hayStatsCargadas = () => {
    const campos = [
      "puntos",
      "rebotes",
      "asistencias",
      "robos",
      "perdidas",
      "tiros_intentados",
      "tiros_convertidos",
      "minutos_jugados",
    ];
    return campos.some((campo) => nuevoJugador[campo] !== "");
  };

  const guardarJugador = () => {
    if (!nuevoJugador.nombre.trim() || !nuevoJugador.equipo_id) {
      setErrorForm("Nombre y equipo son obligatorios.");
      return;
    }

    const equipoId = Number(nuevoJugador.equipo_id);
    let partidoParaStats = null;

    if (hayStatsCargadas()) {
      partidoParaStats = ultimoPartidoDelEquipo(equipoId);
      if (!partidoParaStats) {
        setErrorForm(
          "Ese equipo todavía no tiene partidos cargados, así que no se pueden guardar estadísticas iniciales. El jugador se crea igual, sin stats.",
        );
      }
    }

    setGuardando(true);

    const payload = {
      nombre: nuevoJugador.nombre.trim(),
      equipo_id: equipoId,
      posicion: nuevoJugador.posicion || null,
      dorsal: nuevoJugador.dorsal ? Number(nuevoJugador.dorsal) : null,
      altura_cm: nuevoJugador.altura_cm ? Number(nuevoJugador.altura_cm) : null,
      peso_kg: nuevoJugador.peso_kg ? Number(nuevoJugador.peso_kg) : null,
      edad: nuevoJugador.edad ? Number(nuevoJugador.edad) : null,
    };

    axios
      .post("http://localhost:8000/jugadores", payload, headerAuth())
      .then(async (response) => {
        const jugadorCreado = response.data;

        if (fotoNuevoJugador) {
          await subirFoto(jugadorCreado.id, fotoNuevoJugador);
        }

        if (partidoParaStats) {
          const statsPayload = {
            partido_id: partidoParaStats.id,
            jugador_id: jugadorCreado.id,
            puntos: nuevoJugador.puntos ? Number(nuevoJugador.puntos) : 0,
            rebotes: nuevoJugador.rebotes ? Number(nuevoJugador.rebotes) : 0,
            asistencias: nuevoJugador.asistencias
              ? Number(nuevoJugador.asistencias)
              : 0,
            robos: nuevoJugador.robos ? Number(nuevoJugador.robos) : 0,
            perdidas: nuevoJugador.perdidas ? Number(nuevoJugador.perdidas) : 0,
            tiros_intentados: nuevoJugador.tiros_intentados
              ? Number(nuevoJugador.tiros_intentados)
              : 0,
            tiros_convertidos: nuevoJugador.tiros_convertidos
              ? Number(nuevoJugador.tiros_convertidos)
              : 0,
            minutos_jugados: nuevoJugador.minutos_jugados
              ? Number(nuevoJugador.minutos_jugados)
              : null,
          };
          await axios.post(
            "http://localhost:8000/estadisticas",
            statsPayload,
            headerAuth(),
          );
          cargarEstadisticas();
        }

        cargarJugadores();
        setGuardando(false);
        setModalAbierto(false);
      })
      .catch((error) => {
        console.error("Error creando jugador:", error);
        if (error.response?.status === 401) {
          setErrorForm("Tu sesión expiró. Volvé a iniciar sesión.");
          cerrarSesion();
        } else {
          setErrorForm("No se pudo guardar el jugador. Revisá los datos.");
        }
        setGuardando(false);
      });
  };

  const toggleParaComparar = (jugadorId) => {
    setParaComparar((prev) => {
      if (prev.includes(jugadorId)) {
        return prev.filter((id) => id !== jugadorId);
      }
      if (prev.length >= MAX_COMPARAR) return prev;
      return [...prev, jugadorId];
    });
  };

  const toggleParaCompararEquipo = (equipoId) => {
    setParaCompararEquipos((prev) => {
      if (prev.includes(equipoId)) {
        return prev.filter((id) => id !== equipoId);
      }
      if (prev.length >= MAX_COMPARAR) return prev;
      return [...prev, equipoId];
    });
  };

  const jugadoresFiltrados = jugadores.filter((j) => {
    const pasaEquipo = equipoFiltro
      ? j.equipo_id === Number(equipoFiltro)
      : true;
    const pasaPosicion = posicionFiltro ? j.posicion === posicionFiltro : true;
    const pasaBusqueda = busqueda
      ? j.nombre.toLowerCase().includes(busqueda.toLowerCase())
      : true;
    return pasaEquipo && pasaPosicion && pasaBusqueda;
  });

  const totalPaginas = Math.ceil(jugadoresFiltrados.length / porPagina);
  const jugadoresPagina = jugadoresFiltrados.slice(
    pagina * porPagina,
    (pagina + 1) * porPagina,
  );

  const promedioPorEquipo = useMemo(() => {
    if (
      equipos.length === 0 ||
      jugadores.length === 0 ||
      estadisticas.length === 0
    )
      return [];
    const jugadorAEquipo = {};
    jugadores.forEach((j) => {
      jugadorAEquipo[j.id] = j.equipo_id;
    });
    const sumaPorEquipo = {};
    const cantidadPorEquipo = {};
    estadisticas.forEach((est) => {
      const equipoId = jugadorAEquipo[est.jugador_id];
      if (!equipoId) return;
      sumaPorEquipo[equipoId] = (sumaPorEquipo[equipoId] || 0) + est.puntos;
      cantidadPorEquipo[equipoId] = (cantidadPorEquipo[equipoId] || 0) + 1;
    });
    return equipos
      .map((equipo) => ({
        nombre: equipo.nombre,
        promedio: cantidadPorEquipo[equipo.id]
          ? Number(
              (sumaPorEquipo[equipo.id] / cantidadPorEquipo[equipo.id]).toFixed(
                1,
              ),
            )
          : 0,
      }))
      .sort((a, b) => b.promedio - a.promedio);
  }, [equipos, jugadores, estadisticas]);

  const topGoleadores = useMemo(() => {
    if (jugadores.length === 0 || estadisticas.length === 0) return [];
    const jugadorAPuntos = {};
    estadisticas.forEach((est) => {
      jugadorAPuntos[est.jugador_id] =
        (jugadorAPuntos[est.jugador_id] || 0) + est.puntos;
    });
    return Object.entries(jugadorAPuntos)
      .map(([jugadorId, puntos]) => {
        const jugador = jugadores.find((j) => j.id === Number(jugadorId));
        return { nombre: jugador ? jugador.nombre : jugadorId, puntos };
      })
      .sort((a, b) => b.puntos - a.puntos)
      .slice(0, 10);
  }, [jugadores, estadisticas]);

  const splitTirosFicticio = (jugadorId) => {
    const dos = 40 + (jugadorId % 20);
    const tres = 20 + ((jugadorId * 7) % 20);
    const libres = 100 - dos - tres;
    return [
      { name: "Tiros de 2", value: dos },
      { name: "Tiros de 3", value: tres },
      { name: "Tiros libres", value: libres },
    ];
  };

  const calcularResumen = (jugadorId) => {
    const statsJugador = estadisticas
      .filter((e) => e.jugador_id === jugadorId)
      .map((e) => {
        const partido = partidos.find((p) => p.id === e.partido_id);
        return { ...e, fecha: partido ? partido.fecha : "" };
      })
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const tirosData = splitTirosFicticio(jugadorId);

    if (statsJugador.length === 0) {
      return {
        partidosJugados: 0,
        promedioPuntos: 0,
        promedioRebotes: 0,
        promedioAsistencias: 0,
        historial: [],
        tirosData,
      };
    }

    const totalPuntos = statsJugador.reduce((sum, e) => sum + e.puntos, 0);
    const totalRebotes = statsJugador.reduce((sum, e) => sum + e.rebotes, 0);
    const totalAsistencias = statsJugador.reduce(
      (sum, e) => sum + e.asistencias,
      0,
    );

    return {
      partidosJugados: statsJugador.length,
      promedioPuntos: Number((totalPuntos / statsJugador.length).toFixed(1)),
      promedioRebotes: Number((totalRebotes / statsJugador.length).toFixed(1)),
      promedioAsistencias: Number(
        (totalAsistencias / statsJugador.length).toFixed(1),
      ),
      historial: statsJugador.map((e, i) => ({
        partido: `P${i + 1}`,
        puntos: e.puntos,
        fecha: e.fecha,
      })),
      tirosData,
    };
  };

  const perfilJugador = useMemo(() => {
    if (!jugadorSeleccionado) return null;
    return calcularResumen(jugadorSeleccionado.id);
  }, [jugadorSeleccionado, estadisticas, partidos]);

  const jugadoresComparar = paraComparar
    .map((id) => jugadores.find((j) => j.id === id))
    .filter(Boolean);

  const datosComparacion = useMemo(() => {
    if (jugadoresComparar.length < 2) return [];
    const resumenes = jugadoresComparar.map((j) => calcularResumen(j.id));

    const filas = [
      { stat: "Puntos", key: "promedioPuntos" },
      { stat: "Rebotes", key: "promedioRebotes" },
      { stat: "Asistencias", key: "promedioAsistencias" },
    ];

    return filas.map(({ stat, key }) => {
      const fila = { stat };
      jugadoresComparar.forEach((jugador, i) => {
        fila[jugador.nombre] = resumenes[i][key];
      });
      return fila;
    });
  }, [jugadoresComparar, estadisticas, partidos]);

  const calcularResumenEquipo = (equipoId) => {
    const cantidadJugadores = jugadores.filter(
      (j) => j.equipo_id === equipoId,
    ).length;

    const partidosDelEquipo = partidos.filter(
      (p) =>
        p.equipo_local_id === equipoId || p.equipo_visitante_id === equipoId,
    );

    let victorias = 0;
    let derrotas = 0;
    partidosDelEquipo.forEach((p) => {
      const esLocal = p.equipo_local_id === equipoId;
      const puntosPropios = esLocal ? p.resultado_local : p.resultado_visitante;
      const puntosRival = esLocal ? p.resultado_visitante : p.resultado_local;
      if (puntosPropios == null || puntosRival == null) return;
      if (puntosPropios > puntosRival) victorias += 1;
      else if (puntosPropios < puntosRival) derrotas += 1;
    });

    const entradaPromedio = promedioPorEquipo.find(
      (e) => e.nombre === nombreEquipo(equipoId),
    );

    return {
      cantidadJugadores,
      partidosJugados: partidosDelEquipo.length,
      victorias,
      derrotas,
      promedioPuntos: entradaPromedio ? entradaPromedio.promedio : 0,
    };
  };

  const equiposComparar = paraCompararEquipos
    .map((id) => equipos.find((e) => e.id === id))
    .filter(Boolean);

  const datosCompararEquipos = useMemo(() => {
    if (equiposComparar.length < 2) return [];
    const resumenes = equiposComparar.map((e) => calcularResumenEquipo(e.id));

    return [
      {
        stat: "Promedio puntos",
        ...Object.fromEntries(
          equiposComparar.map((e, i) => [
            e.nombre,
            resumenes[i].promedioPuntos,
          ]),
        ),
      },
      {
        stat: "Victorias",
        ...Object.fromEntries(
          equiposComparar.map((e, i) => [e.nombre, resumenes[i].victorias]),
        ),
      },
      {
        stat: "Derrotas",
        ...Object.fromEntries(
          equiposComparar.map((e, i) => [e.nombre, resumenes[i].derrotas]),
        ),
      },
    ];
  }, [equiposComparar, jugadores, partidos, promedioPorEquipo]);

  const historialH2H = useMemo(() => {
    if (equiposComparar.length !== 2) return [];
    const [a, b] = equiposComparar;
    return partidos
      .filter(
        (p) =>
          (p.equipo_local_id === a.id && p.equipo_visitante_id === b.id) ||
          (p.equipo_local_id === b.id && p.equipo_visitante_id === a.id),
      )
      .sort((x, y) => new Date(y.fecha) - new Date(x.fecha));
  }, [equiposComparar, partidos]);

  const toggleJugador = (jugador) => {
    setJugadorSeleccionado((prev) =>
      prev && prev.id === jugador.id ? null : jugador,
    );
  };

  const exportarPerfilPDF = (jugador, perfil) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text(jugador.nombre, 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(
      `${nombreEquipo(jugador.equipo_id)} — ${jugador.posicion || "-"} — Dorsal #${jugador.dorsal ?? "-"}`,
      14,
      28,
    );

    doc.setFontSize(10);
    doc.setTextColor(0);
    const datosFisicos = [
      ["Edad", jugador.edad ?? "-"],
      ["Altura", jugador.altura_cm ? `${jugador.altura_cm} cm` : "-"],
      ["Peso", jugador.peso_kg ? `${jugador.peso_kg} kg` : "-"],
    ];
    autoTable(doc, {
      startY: 36,
      head: [["Dato físico", "Valor"]],
      body: datosFisicos,
      theme: "grid",
      headStyles: { fillColor: [232, 99, 28] },
      margin: { left: 14 },
      tableWidth: 90,
    });

    const promedios = [
      ["Partidos jugados", perfil.partidosJugados],
      ["Promedio de puntos", perfil.promedioPuntos],
      ["Promedio de rebotes", perfil.promedioRebotes],
      ["Promedio de asistencias", perfil.promedioAsistencias],
    ];
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Estadística", "Valor"]],
      body: promedios,
      theme: "grid",
      headStyles: { fillColor: [124, 92, 252] },
      margin: { left: 14 },
      tableWidth: 90,
    });

    if (perfil.historial.length > 0) {
      const filasHistorial = perfil.historial.map((h) => [
        h.partido,
        h.fecha || "-",
        h.puntos,
      ]);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Partido", "Fecha", "Puntos"]],
        body: filasHistorial,
        theme: "striped",
        headStyles: { fillColor: [50, 55, 65] },
        margin: { left: 14 },
      });
    }

    doc.save(`${jugador.nombre.replace(/\s+/g, "_")}_perfil.pdf`);
  };
  const jugadorActual = jugadorSeleccionado
    ? jugadores.find((j) => j.id === jugadorSeleccionado.id) ||
      jugadorSeleccionado
    : null;

  return (
    <div className="app">
      <div className="topbar">
        {token && (
          <button
            className="btn-texto"
            onClick={() => setModalCrearUsuario(true)}
          >
            + Crear usuario
          </button>
        )}
        {token ? (
          <button className="btn-sesion logueado" onClick={cerrarSesion}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
            Cerrar sesión
          </button>
        ) : (
          <button className="btn-sesion" onClick={abrirLogin}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
            Iniciar sesión
          </button>
        )}
      </div>

      <h1>Basquet Stats</h1>
      <div className="hero">
        <div className="hero-stat">
          <span className="valor">{jugadores.length}</span>
          <span className="etiqueta">Jugadores</span>
        </div>
        <div className="hero-stat">
          <span className="valor">{equipos.length}</span>
          <span className="etiqueta">Equipos</span>
        </div>
        <div className="hero-stat">
          <span className="valor">{partidos.length}</span>
          <span className="etiqueta">Partidos</span>
        </div>
      </div>

      <div className="seccion">
        <h2>Promedio de puntos por equipo</h2>
        <div className="panel">
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={promedioPorEquipo} margin={{ bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E3644" />
              <XAxis
                dataKey="nombre"
                angle={-45}
                textAnchor="end"
                interval={0}
                height={100}
                stroke="#8B93A3"
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="#8B93A3" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#1C222C",
                  border: "1px solid #2E3644",
                  color: "#E7E9ED",
                }}
              />
              <Bar
                dataKey="promedio"
                fill="#E8631C"
                animationDuration={1600}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="seccion">
        <h2>Top 10 goleadores</h2>
        <div className="panel">
          <ResponsiveContainer width="100%" height={420}>
            <BarChart
              data={topGoleadores}
              layout="vertical"
              margin={{ left: 130 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2E3644" />
              <XAxis type="number" stroke="#8B93A3" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="nombre"
                width={120}
                stroke="#8B93A3"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#1C222C",
                  border: "1px solid #2E3644",
                  color: "#E7E9ED",
                }}
              />
              <Bar
                dataKey="puntos"
                fill="#7C5CFC"
                animationDuration={1600}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="seccion">
        <div className="jugadores-header">
          <h2>Equipos</h2>
          <button className="btn-nuevo" onClick={abrirModalPartido}>
            + Nuevo partido
          </button>
        </div>

        {paraCompararEquipos.length > 0 && (
          <div className="barra-comparar">
            <span>
              {paraCompararEquipos.length} equipo
              {paraCompararEquipos.length > 1 ? "s" : ""} seleccionado
              {paraCompararEquipos.length > 1 ? "s" : ""} (máx. {MAX_COMPARAR})
            </span>
            <div className="barra-comparar-acciones">
              <button
                className="btn-nuevo"
                disabled={paraCompararEquipos.length < 2}
                onClick={() => setModalCompararEquipos(true)}
              >
                Comparar
              </button>
              <button
                className="btn-secundario"
                onClick={() => setParaCompararEquipos([])}
              >
                Limpiar
              </button>
            </div>
          </div>
        )}

        <div className="panel" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Equipo</th>
                <th>Categoría</th>
                <th>Jugadores</th>
                <th>Partidos</th>
                <th>Récord</th>
                <th>Promedio puntos</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((equipo) => {
                const resumen = calcularResumenEquipo(equipo.id);
                return (
                  <tr key={equipo.id}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={paraCompararEquipos.includes(equipo.id)}
                        disabled={
                          !paraCompararEquipos.includes(equipo.id) &&
                          paraCompararEquipos.length >= MAX_COMPARAR
                        }
                        onChange={() => toggleParaCompararEquipo(equipo.id)}
                      />
                    </td>
                    <td>{equipo.nombre}</td>
                    <td>{equipo.categoria || "-"}</td>
                    <td>{resumen.cantidadJugadores}</td>
                    <td>{resumen.partidosJugados}</td>
                    <td>
                      {resumen.victorias}V - {resumen.derrotas}D
                    </td>
                    <td>{resumen.promedioPuntos}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="seccion">
        <div className="jugadores-header">
          <h2>Jugadores</h2>
          <button className="btn-nuevo" onClick={abrirModalNuevoJugador}>
            + Nuevo jugador
          </button>
        </div>

        <div className="buscador">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(0);
            }}
          />
        </div>

        <div className="filtro">
          <span>Equipo</span>
          <select
            value={equipoFiltro}
            onChange={(e) => {
              setEquipoFiltro(e.target.value);
              setPagina(0);
            }}
          >
            <option value="">Todos</option>
            {equipos.map((equipo) => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.nombre}
              </option>
            ))}
          </select>

          <span>Posición</span>
          <select
            value={posicionFiltro}
            onChange={(e) => {
              setPosicionFiltro(e.target.value);
              setPagina(0);
            }}
          >
            <option value="">Todas</option>
            {POSICIONES.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {paraComparar.length > 0 && (
          <div className="barra-comparar">
            <span>
              {paraComparar.length} jugador{paraComparar.length > 1 ? "es" : ""}{" "}
              seleccionado{paraComparar.length > 1 ? "s" : ""} (máx.{" "}
              {MAX_COMPARAR})
            </span>
            <div className="barra-comparar-acciones">
              <button
                className="btn-nuevo"
                disabled={paraComparar.length < 2}
                onClick={() => setModalComparar(true)}
              >
                Comparar
              </button>
              <button
                className="btn-secundario"
                onClick={() => setParaComparar([])}
              >
                Limpiar
              </button>
            </div>
          </div>
        )}

        <div className="panel" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th></th>
                <th></th>
                <th>Nombre</th>
                <th>Posición</th>
                <th>Dorsal</th>
                <th>Equipo</th>
              </tr>
            </thead>
            <tbody>
              {jugadoresPagina.map((jugador) => (
                <>
                  <tr
                    key={jugador.id}
                    className={`fila-jugador ${jugadorSeleccionado?.id === jugador.id ? "seleccionada" : ""}`}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={paraComparar.includes(jugador.id)}
                        disabled={
                          !paraComparar.includes(jugador.id) &&
                          paraComparar.length >= MAX_COMPARAR
                        }
                        onChange={() => toggleParaComparar(jugador.id)}
                      />
                    </td>
                    <td
                      onClick={() => toggleJugador(jugador)}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={avatarUrl(jugador)}
                        alt={jugador.nombre}
                        width="32"
                        height="32"
                        className="avatar"
                      />
                    </td>
                    <td
                      onClick={() => toggleJugador(jugador)}
                      style={{ cursor: "pointer" }}
                    >
                      {jugador.nombre}
                    </td>
                    <td
                      onClick={() => toggleJugador(jugador)}
                      style={{ cursor: "pointer" }}
                    >
                      {jugador.posicion}
                    </td>
                    <td
                      onClick={() => toggleJugador(jugador)}
                      style={{ cursor: "pointer" }}
                    >
                      {jugador.dorsal}
                    </td>
                    <td
                      onClick={() => toggleJugador(jugador)}
                      style={{ cursor: "pointer" }}
                    >
                      {nombreEquipo(jugador.equipo_id)}
                    </td>
                  </tr>

                  {jugadorSeleccionado?.id === jugador.id &&
                    perfilJugador &&
                    jugadorActual && (
                      <tr key={`${jugador.id}-perfil`}>
                        <td colSpan="6" style={{ padding: 0, border: "none" }}>
                          <div className="perfil">
                            <div className="perfil-header">
                              <div className="perfil-avatar-wrap">
                                <img
                                  src={avatarUrl(jugadorActual)}
                                  alt={jugadorActual.nombre}
                                  width="64"
                                  height="64"
                                  className="avatar"
                                />
                                {token && (
                                  <label className="cambiar-foto">
                                    {subiendoFoto
                                      ? "Subiendo…"
                                      : "Cambiar foto"}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: "none" }}
                                      disabled={subiendoFoto}
                                      onChange={(e) => {
                                        if (e.target.files[0]) {
                                          subirFoto(
                                            jugadorActual.id,
                                            e.target.files[0],
                                          );
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                              <div className="perfil-avatar-wrap">
                                <img
                                  src={avatarUrl(jugadorActual)}
                                  alt={jugadorActual.nombre}
                                  width="64"
                                  height="64"
                                  className="avatar"
                                />
                                {token && (
                                  <label className="cambiar-foto">
                                    {subiendoFoto
                                      ? "Subiendo…"
                                      : "Cambiar foto"}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: "none" }}
                                      disabled={subiendoFoto}
                                      onChange={(e) => {
                                        if (e.target.files[0]) {
                                          subirFoto(
                                            jugadorActual.id,
                                            e.target.files[0],
                                          );
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>

                              <button
                                className="btn-pdf"
                                onClick={() =>
                                  exportarPerfilPDF(
                                    jugadorActual,
                                    perfilJugador,
                                  )
                                }
                              >
                                Exportar PDF
                              </button>
                              <div className="perfil-stats">
                                <div>
                                  <strong>{jugadorActual.edad ?? "-"}</strong>
                                  Edad
                                </div>
                                <div>
                                  <strong>
                                    {jugadorActual.altura_cm
                                      ? `${jugadorActual.altura_cm} cm`
                                      : "-"}
                                  </strong>
                                  Altura
                                </div>
                                <div>
                                  <strong>
                                    {jugadorActual.peso_kg
                                      ? `${jugadorActual.peso_kg} kg`
                                      : "-"}
                                  </strong>
                                  Peso
                                </div>
                                <div>
                                  <strong>
                                    {perfilJugador.partidosJugados}
                                  </strong>
                                  Partidos
                                </div>
                                <div>
                                  <strong>
                                    {perfilJugador.promedioPuntos}
                                  </strong>
                                  Puntos
                                </div>
                                <div>
                                  <strong>
                                    {perfilJugador.promedioRebotes}
                                  </strong>
                                  Rebotes
                                </div>
                                <div>
                                  <strong>
                                    {perfilJugador.promedioAsistencias}
                                  </strong>
                                  Asistencias
                                </div>
                              </div>
                            </div>

                            <div className="perfil-graficos">
                              {perfilJugador.historial.length > 0 && (
                                <div style={{ flex: "2 1 400px" }}>
                                  <h4>Evolución de puntos por partido</h4>
                                  <ResponsiveContainer
                                    width="100%"
                                    height={200}
                                  >
                                    <LineChart data={perfilJugador.historial}>
                                      <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#3A3F4A"
                                      />
                                      <XAxis
                                        dataKey="partido"
                                        stroke="#8B93A3"
                                        tick={{ fontSize: 11 }}
                                      />
                                      <YAxis
                                        stroke="#8B93A3"
                                        tick={{ fontSize: 11 }}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          background: "#1C222C",
                                          border: "1px solid #2E3644",
                                          color: "#E7E9ED",
                                        }}
                                        cursor={{ fill: "rgba(0, 0, 0, 0.35)" }}
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="puntos"
                                        stroke="#E8631C"
                                        strokeWidth={2}
                                        dot={false}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              )}

                              <div style={{ flex: "1 1 260px" }}>
                                <h4>Distribución de tiros (estimada)</h4>
                                <ResponsiveContainer width="100%" height={240}>
                                  <PieChart margin={{ top: 20, bottom: 10 }}>
                                    <Pie
                                      data={perfilJugador.tirosData}
                                      dataKey="value"
                                      nameKey="name"
                                      cx="50%"
                                      cy="52%"
                                      outerRadius={60}
                                      label={({ value }) => `${value}%`}
                                    >
                                      {perfilJugador.tirosData.map(
                                        (entry, index) => (
                                          <Cell
                                            key={`cell-${index}`}
                                            fill={
                                              COLORES_TIROS[
                                                index % COLORES_TIROS.length
                                              ]
                                            }
                                          />
                                        ),
                                      )}
                                    </Pie>
                                    <Legend
                                      wrapperStyle={{
                                        fontSize: 12,
                                        color: "#8B93A3",
                                      }}
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        background: "#1C222C",
                                        border: "1px solid #2E3644",
                                        color: "#E7E9ED",
                                      }}
                                      cursor={{ fill: "rgba(0, 0, 0, 0.7)" }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <div className="paginacion">
          <button
            onClick={() => setPagina((p) => Math.max(p - 1, 0))}
            disabled={pagina === 0}
          >
            Anterior
          </button>
          <span>
            Página {pagina + 1} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas - 1))}
            disabled={pagina >= totalPaginas - 1}
          >
            Siguiente
          </button>
        </div>
      </div>

      {modalLogin && (
        <div className="modal-overlay" onClick={() => setModalLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Iniciar sesión</h3>

            <label>
              Usuario
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                onKeyDown={(e) => e.key === "Enter" && iniciarSesion()}
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                onKeyDown={(e) => e.key === "Enter" && iniciarSesion()}
              />
            </label>

            {loginError && <p className="modal-error">{loginError}</p>}

            <div className="modal-acciones">
              <button
                className="btn-secundario"
                onClick={() => setModalLogin(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-nuevo"
                onClick={iniciarSesion}
                disabled={logueando}
              >
                {logueando ? "Ingresando..." : "Ingresar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {modalCrearUsuario && (
        <div
          className="modal-overlay"
          onClick={() => setModalCrearUsuario(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Crear usuario</h3>

            <label>
              Usuario
              <input
                type="text"
                value={nuevoUsuarioForm.username}
                onChange={(e) =>
                  setNuevoUsuarioForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                value={nuevoUsuarioForm.password}
                onChange={(e) =>
                  setNuevoUsuarioForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
            </label>

            {errorCrearUsuario && (
              <p className="modal-error">{errorCrearUsuario}</p>
            )}
            {exitoCrearUsuario && (
              <p style={{ color: "#4FA184", fontSize: 13, margin: 0 }}>
                {exitoCrearUsuario}
              </p>
            )}

            <div className="modal-acciones">
              <button
                className="btn-secundario"
                onClick={() => setModalCrearUsuario(false)}
              >
                Cerrar
              </button>
              <button
                className="btn-nuevo"
                onClick={crearUsuario}
                disabled={creandoUsuario}
              >
                {creandoUsuario ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalPartido && (
        <div className="modal-overlay" onClick={() => setModalPartido(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo partido</h3>

            <label>
              Fecha
              <input
                type="date"
                value={nuevoPartido.fecha}
                onChange={(e) =>
                  actualizarCampoPartido("fecha", e.target.value)
                }
              />
            </label>

            <label>
              Equipo local
              <select
                value={nuevoPartido.equipo_local_id}
                onChange={(e) =>
                  actualizarCampoPartido("equipo_local_id", e.target.value)
                }
              >
                <option value="">Seleccionar equipo</option>
                {equipos.map((equipo) => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Equipo visitante
              <select
                value={nuevoPartido.equipo_visitante_id}
                onChange={(e) =>
                  actualizarCampoPartido("equipo_visitante_id", e.target.value)
                }
              >
                <option value="">Seleccionar equipo</option>
                {equipos.map((equipo) => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.nombre}
                  </option>
                ))}
              </select>
            </label>

            <div className="modal-fila">
              <label>
                Resultado local
                <input
                  type="number"
                  value={nuevoPartido.resultado_local}
                  onChange={(e) =>
                    actualizarCampoPartido("resultado_local", e.target.value)
                  }
                />
              </label>
              <label>
                Resultado visitante
                <input
                  type="number"
                  value={nuevoPartido.resultado_visitante}
                  onChange={(e) =>
                    actualizarCampoPartido(
                      "resultado_visitante",
                      e.target.value,
                    )
                  }
                />
              </label>
            </div>

            {errorPartido && <p className="modal-error">{errorPartido}</p>}

            <div className="modal-acciones">
              <button
                className="btn-secundario"
                onClick={() => setModalPartido(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-nuevo"
                onClick={guardarPartido}
                disabled={guardandoPartido}
              >
                {guardandoPartido ? "Guardando..." : "Guardar partido"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div
            className="modal modal-nuevo-jugador"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Nuevo jugador</h3>

            <div className="foto-nuevo-wrap">
              <img
                src={
                  fotoNuevoJugador
                    ? URL.createObjectURL(fotoNuevoJugador)
                    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nuevoJugador.nombre || "?")}&backgroundColor=E8631C,4FA184,C68E4E`
                }
                alt="Vista previa"
                width="64"
                height="64"
                className="avatar"
              />
              <label className="cambiar-foto">
                {fotoNuevoJugador ? "Cambiar foto" : "Subir foto"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files[0])
                      setFotoNuevoJugador(e.target.files[0]);
                  }}
                />
              </label>
            </div>

            <label>
              Nombre
              <input
                type="text"
                value={nuevoJugador.nombre}
                onChange={(e) => actualizarCampo("nombre", e.target.value)}
              />
            </label>

            <label>
              Equipo
              <select
                value={nuevoJugador.equipo_id}
                onChange={(e) => actualizarCampo("equipo_id", e.target.value)}
              >
                <option value="">Seleccionar equipo</option>
                {equipos.map((equipo) => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Posición
              <select
                value={nuevoJugador.posicion}
                onChange={(e) => actualizarCampo("posicion", e.target.value)}
              >
                {POSICIONES.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </label>

            <div className="modal-fila">
              <label>
                Dorsal
                <input
                  type="number"
                  value={nuevoJugador.dorsal}
                  onChange={(e) => actualizarCampo("dorsal", e.target.value)}
                />
              </label>

              <label>
                Edad
                <input
                  type="number"
                  value={nuevoJugador.edad}
                  onChange={(e) => actualizarCampo("edad", e.target.value)}
                />
              </label>
            </div>

            <div className="modal-fila">
              <label>
                Altura (cm)
                <input
                  type="number"
                  value={nuevoJugador.altura_cm}
                  onChange={(e) => actualizarCampo("altura_cm", e.target.value)}
                />
              </label>

              <label>
                Peso (kg)
                <input
                  type="number"
                  value={nuevoJugador.peso_kg}
                  onChange={(e) => actualizarCampo("peso_kg", e.target.value)}
                />
              </label>
            </div>

            <h4 className="modal-subtitulo">
              Estadísticas iniciales (opcional)
            </h4>
            <p className="modal-ayuda">
              Se cargan como su registro más reciente contra el último partido
              de su equipo.
            </p>

            <div className="modal-fila">
              <label>
                Puntos
                <input
                  type="number"
                  value={nuevoJugador.puntos}
                  onChange={(e) => actualizarCampo("puntos", e.target.value)}
                />
              </label>
              <label>
                Rebotes
                <input
                  type="number"
                  value={nuevoJugador.rebotes}
                  onChange={(e) => actualizarCampo("rebotes", e.target.value)}
                />
              </label>
              <label>
                Asistencias
                <input
                  type="number"
                  value={nuevoJugador.asistencias}
                  onChange={(e) =>
                    actualizarCampo("asistencias", e.target.value)
                  }
                />
              </label>
            </div>

            <div className="modal-fila">
              <label>
                Robos
                <input
                  type="number"
                  value={nuevoJugador.robos}
                  onChange={(e) => actualizarCampo("robos", e.target.value)}
                />
              </label>
              <label>
                Pérdidas
                <input
                  type="number"
                  value={nuevoJugador.perdidas}
                  onChange={(e) => actualizarCampo("perdidas", e.target.value)}
                />
              </label>
              <label>
                Minutos
                <input
                  type="number"
                  value={nuevoJugador.minutos_jugados}
                  onChange={(e) =>
                    actualizarCampo("minutos_jugados", e.target.value)
                  }
                />
              </label>
            </div>

            <div className="modal-fila">
              <label>
                Tiros intentados
                <input
                  type="number"
                  value={nuevoJugador.tiros_intentados}
                  onChange={(e) =>
                    actualizarCampo("tiros_intentados", e.target.value)
                  }
                />
              </label>
              <label>
                Tiros convertidos
                <input
                  type="number"
                  value={nuevoJugador.tiros_convertidos}
                  onChange={(e) =>
                    actualizarCampo("tiros_convertidos", e.target.value)
                  }
                />
              </label>
            </div>

            {errorForm && <p className="modal-error">{errorForm}</p>}

            <div className="modal-acciones">
              <button className="btn-secundario" onClick={cerrarModal}>
                Cancelar
              </button>
              <button
                className="btn-nuevo"
                onClick={guardarJugador}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar jugador"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalComparar && jugadoresComparar.length >= 2 && (
        <div className="modal-overlay" onClick={() => setModalComparar(false)}>
          <div
            className="modal modal-comparar"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Comparar jugadores</h3>

            <div className="comparar-cabezas">
              {jugadoresComparar.map((jugador, i) => (
                <div className="comparar-cabeza" key={jugador.id}>
                  <img
                    src={avatarUrl(jugador)}
                    alt={jugador.nombre}
                    width="56"
                    height="56"
                    className="avatar"
                    style={{ borderColor: COLORES_COMPARAR[i] }}
                  />
                  <strong>{jugador.nombre}</strong>
                  <span>{nombreEquipo(jugador.equipo_id)}</span>
                  <span className="comparar-posicion">{jugador.posicion}</span>
                </div>
              ))}
            </div>

            <table className="comparar-tabla">
              <tbody>
                <tr>
                  <td>Edad</td>
                  {jugadoresComparar.map((j) => (
                    <td key={j.id}>{j.edad ?? "-"}</td>
                  ))}
                </tr>
                <tr>
                  <td>Altura</td>
                  {jugadoresComparar.map((j) => (
                    <td key={j.id}>
                      {j.altura_cm ? `${j.altura_cm} cm` : "-"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Peso</td>
                  {jugadoresComparar.map((j) => (
                    <td key={j.id}>{j.peso_kg ? `${j.peso_kg} kg` : "-"}</td>
                  ))}
                </tr>
                <tr>
                  <td>Dorsal</td>
                  {jugadoresComparar.map((j) => (
                    <td key={j.id}>{j.dorsal ?? "-"}</td>
                  ))}
                </tr>
              </tbody>
            </table>

            <h4>Promedios por partido</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={datosComparacion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3644" />
                <XAxis
                  dataKey="stat"
                  stroke="#8B93A3"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#8B93A3" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#1C222C",
                    border: "1px solid #2E3644",
                    color: "#E7E9ED",
                  }}
                  cursor={{ fill: "rgba(0, 0, 0, 0.35)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#8B93A3" }} />
                {jugadoresComparar.map((jugador, i) => (
                  <Bar
                    key={jugador.id}
                    dataKey={jugador.nombre}
                    fill={COLORES_COMPARAR[i]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>

            <div className="modal-acciones">
              <button
                className="btn-secundario"
                onClick={() => setModalComparar(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalCompararEquipos && equiposComparar.length >= 2 && (
        <div
          className="modal-overlay"
          onClick={() => setModalCompararEquipos(false)}
        >
          <div
            className="modal modal-comparar"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Comparar equipos</h3>

            <div className="comparar-cabezas">
              {equiposComparar.map((equipo) => {
                const resumen = calcularResumenEquipo(equipo.id);
                return (
                  <div className="comparar-cabeza" key={equipo.id}>
                    <strong>{equipo.nombre}</strong>
                    <span>{equipo.categoria || "-"}</span>
                    <span>
                      {resumen.victorias}V - {resumen.derrotas}D
                    </span>
                  </div>
                );
              })}
            </div>

            <h4>Comparativa</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={datosCompararEquipos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3644" />
                <XAxis
                  dataKey="stat"
                  stroke="#8B93A3"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#8B93A3" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#1C222C",
                    border: "1px solid #2E3644",
                    color: "#E7E9ED",
                  }}
                  cursor={{ fill: "rgba(0, 0, 0, 0.35)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#8B93A3" }} />
                {equiposComparar.map((equipo, i) => (
                  <Bar
                    key={equipo.id}
                    dataKey={equipo.nombre}
                    fill={COLORES_COMPARAR[i]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>

            {historialH2H.length > 0 && (
              <>
                <h4>Enfrentamientos directos</h4>
                <table className="comparar-tabla">
                  <tbody>
                    {historialH2H.map((p) => (
                      <tr key={p.id}>
                        <td style={{ textAlign: "left" }}>{p.fecha}</td>
                        <td>
                          {nombreEquipo(p.equipo_local_id)} {p.resultado_local}{" "}
                          - {p.resultado_visitante}{" "}
                          {nombreEquipo(p.equipo_visitante_id)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div className="modal-acciones">
              <button
                className="btn-secundario"
                onClick={() => setModalCompararEquipos(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
