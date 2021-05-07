import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { useHistory } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';
import './CollectMap.css';
import Header from './Header';

import crossLogo from './cross-sign.png';
import filterLogo from './filterlogo.png';
import pins from '../data/pins';

import pinsVerreLogo from '../images/pins/verre.png';
import pinsCartonLogo from '../images/pins/carton.png';
import pinsOrduresLogo from '../images/pins/ordures.png';
import pinsTrisacLogo from '../images/pins/trisac.png';
import pinsCompostLogo from '../images/pins/compost.png';
import pinsDechetteLogo from '../images/pins/dechette.png';

const profilUser = {
  name: 'Bastien Tacos',
  avatar: 'https://bit.ly/2OK8Gy4',
  mail: 'bastien.tacos@tacos.com',
  adress: '75 Rue des Français Libres, 44000 Nantes, France',
  latitude: 47.207048,
  longitude: -1.5462102,
  latLong: [47.207048, -1.5462102],
};

// eslint-disable-next-line react/prop-types
const CollectMap = ({ setUserLoc, setDepositPoint }) => {
  const [center, setCenter] = useState({
    loaded: false,
    lat: profilUser.latitude,
    lng: profilUser.longitude,
  });
  const ZOOM_LEVEL = 14;

  // GEOLOCALISATION
  const options = {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 27000,
  };

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          setCenter({
            loaded: true,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        function b(error) {
          // eslint-disable-next-line no-console
          console.error(`error ${error.code} ${error.message}`);
        },
        options
      );
    }
  }, []);

  // API code postal => coordonnées
  const [msgHelp, setMsgHelp] = useState(
    <div>
      <p>
        Si vous ne savez pas comment activer la géolocalisation, essayez ceci:
      </p>{' '}
      <ul>
        <li>
          <a href="https://support.google.com/chrome/answer/142065?hl=en&co=GENIE.Platform%3DAndroid&oco=1">
            Android (Chrome)
          </a>
        </li>
        <li>
          <a href="https://support.google.com/chrome/answer/142065?hl=en&co=GENIE.Platform%3DiOS&oco=1">
            Apple (Chrome)
          </a>
        </li>
      </ul>
    </div>
  );
  const apiCPcoord = (cp) => {
    axios
      .get(`https://geo.api.gouv.fr/communes?codePostal=${cp}&format=geojson`)
      .then((response) => {
        if (!response.data.features.length) {
          setMsgHelp('Code postal non valide, veuillez recharger la page.');
        } else {
          const coord = {
            lat: response.data.features[0].geometry.coordinates[1],
            lng: response.data.features[0].geometry.coordinates[0],
          };
          setCenter({
            loaded: true,
            lat: coord.lat,
            lng: coord.lng,
          });
        }
      });
  };

  const [cp, setCp] = useState('');
  const handleCpSubmit = () => {
    apiCPcoord(cp);
  };

  // API
  let apiAerialColumn;
  let apiCompost;
  let apiDechette;
  const [column, setColumn] = useState([]);
  const [columnInit, setColumnInit] = useState([]);
  const [compost, setCompost] = useState([]);
  const [compostInit, setCompostInit] = useState([]);
  const [dechette, setDechette] = useState([]);
  const [dechetteInit, setDechetteInit] = useState([]);
  const [selectAll, setSelectAll] = useState(true);

  const apiCall = () => {
    if (column.length > 0) {
      setColumn([]);
      setColumnInit([]);
      setCompost([]);
      setDechette([]);
      setDechetteInit([]);
      setCompostInit([]);
    } else {
      // API COLLONNES AERIENNES
      axios
        .get(
          'https://data.nantesmetropole.fr/api/records/1.0/search/?dataset=244400404_colonnes-aeriennes-nantes-metropole&q=&facet=type_dechet&facet=commune&facet=pole',
          {
            params: {
              apikey:
                '04a7eb6b96d9388e1563ce20a134636ecea950ff095a6e554ae00c66',
              rows: 1150,
            },
          }
        )
        .then((response) => response.data)
        .then((data) => {
          apiAerialColumn = data.records;
          const filteredColumn = apiAerialColumn.filter((el) => {
            if (!apiAerialColumn[el.fields.id_colonne]) {
              apiAerialColumn[el.fields.id_colonne] = true;
              return true;
            }
            return false;
          }, Object.create(null));
          setColumn(filteredColumn);
          setColumnInit(filteredColumn);
        });

      // API COMPOST
      axios
        .get(
          'https://data.nantesmetropole.fr/api/records/1.0/search/?dataset=512042839_composteurs-quartier-nantes-metropole&q=&facet=categorie&facet=lieu&facet=annee',
          {
            params: {
              apikey:
                '04a7eb6b96d9388e1563ce20a134636ecea950ff095a6e554ae00c66',
              rows: 500,
            },
          }
        )
        .then((response) => response.data)
        .then((data) => {
          apiCompost = data.records;
          const filtered = apiCompost.filter((el) => {
            if (!apiCompost[el.fields.id]) {
              apiCompost[el.fields.id] = true;
              return true;
            }
            return false;
          }, Object.create(null));
          setCompost(filtered);
          setCompostInit(filtered);
        });
      // API DECHETERIE
      axios
        .get(
          'https://data.nantesmetropole.fr/api/records/1.0/search/?dataset=244400404_decheteries-ecopoints-nantes-metropole&q=&facet=libtype&facet=commune&facet=batteries&facet=bois&facet=carton&facet=gravats&facet=deee&facet=encombrants_menagers&facet=ferrailles&facet=huiles_moteur&facet=papiers_journaux_livres&facet=plastiques_menagers&facet=pneus&facet=textiles&facet=dechets_verts&facet=verre&facet=piles&facet=mobilier&facet=cartouches&facet=extincteur&facet=neons_lampes&facet=dechets_dangereux&facet=bouteilles_gaz',
          {
            params: {
              apikey:
                '04a7eb6b96d9388e1563ce20a134636ecea950ff095a6e554ae00c66',
              rows: 50,
            },
          }
        )
        .then((response) => response.data)
        .then((data) => {
          apiDechette = data.records;
          setDechette(apiDechette);
          setDechetteInit(apiDechette);
        });
    }
  };

  useEffect(() => {
    apiCall();
  }, []);

  const showInMapClicked = (lat, lon) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${center.latitude},${center.longitude}&destination=${lat},${lon}`
    );
  };

  const [buttonFilter, setButtonFilter] = useState(true);

  const toggleActive = () => {
    setTimeout(() => {
      setButtonFilter(!buttonFilter);
    }, 100);
  };

  // eslint-disable-next-line no-unused-vars
  const [filtreDechet, setFiltreDechet] = useState({
    verre: true,
    cartons: true,
    trisac: true,
    ordures: true,
    compost: true,
    dechette: true,
  });

  const handleFilterChange = (state) => {
    const array = columnInit.filter(
      (colonne) =>
        (colonne.fields.type_dechet === 'Verre' && state.verre) ||
        (colonne.fields.type_dechet === 'Papier-carton' && state.cartons) ||
        (colonne.fields.type_dechet === 'Ordure ménagère' && state.ordures) ||
        (colonne.fields.type_dechet === 'Trisac' && state.trisac)
    );
    setColumn(array);
    if (state.compost) {
      setCompost(compostInit);
    } else {
      setCompost([]);
    }
    if (state.dechette) {
      setDechette(dechetteInit);
    } else {
      setDechette([]);
    }
  };

  const verreFilter = () => {
    const state = {
      verre: !filtreDechet.verre,
      cartons: filtreDechet.cartons,
      trisac: filtreDechet.trisac,
      ordures: filtreDechet.ordures,
      compost: filtreDechet.compost,
      dechette: filtreDechet.dechette,
    };
    setTimeout(() => {
      setFiltreDechet(state);
    }, 0);
    handleFilterChange(state);
  };

  const cartonsFilter = () => {
    const state = {
      verre: filtreDechet.verre,
      cartons: !filtreDechet.cartons,
      trisac: filtreDechet.trisac,
      ordures: filtreDechet.ordures,
      compost: filtreDechet.compost,
      dechette: filtreDechet.dechette,
    };
    setTimeout(() => {
      setFiltreDechet(state);
    }, 0);
    handleFilterChange(state);
  };

  const orduresFilter = () => {
    const state = {
      verre: filtreDechet.verre,
      cartons: filtreDechet.cartons,
      trisac: filtreDechet.trisac,
      ordures: !filtreDechet.ordures,
      compost: filtreDechet.compost,
      dechette: filtreDechet.dechette,
    };
    setTimeout(() => {
      setFiltreDechet(state);
    }, 0);
    handleFilterChange(state);
  };

  const trisacFilter = () => {
    const state = {
      verre: filtreDechet.verre,
      cartons: filtreDechet.cartons,
      trisac: !filtreDechet.trisac,
      ordures: filtreDechet.ordures,
      compost: filtreDechet.compost,
      dechette: filtreDechet.dechette,
    };
    setTimeout(() => {
      setFiltreDechet(state);
    }, 0);
    handleFilterChange(state);
  };

  const compostFilter = () => {
    const state = {
      verre: filtreDechet.verre,
      cartons: filtreDechet.cartons,
      trisac: filtreDechet.trisac,
      ordures: filtreDechet.ordures,
      compost: !filtreDechet.compost,
      dechette: filtreDechet.dechette,
    };
    setTimeout(() => {
      setFiltreDechet(state);
    }, 100);
    handleFilterChange(state);
  };

  const dechetteFilter = () => {
    const state = {
      verre: filtreDechet.verre,
      cartons: filtreDechet.cartons,
      trisac: filtreDechet.trisac,
      ordures: filtreDechet.ordures,
      compost: filtreDechet.compost,
      dechette: !filtreDechet.dechette,
    };
    setTimeout(() => {
      setFiltreDechet(state);
    }, 100);
    handleFilterChange(state);
  };

  const unSelect = () => {
    let state;
    if (
      filtreDechet.verre ||
      filtreDechet.trisac ||
      filtreDechet.cartons ||
      filtreDechet.ordures ||
      filtreDechet.trisac ||
      filtreDechet.compost ||
      filtreDechet.dechette
    ) {
      state = {
        verre: false,
        cartons: false,
        trisac: false,
        ordures: false,
        compost: false,
        dechette: false,
      };
      setSelectAll(false);
    } else {
      state = {
        verre: true,
        cartons: true,
        trisac: true,
        ordures: true,
        compost: true,
        dechette: true,
      };
      setSelectAll(true);
    }
    setTimeout(() => {
      setFiltreDechet(state);
    }, 100);
    handleFilterChange(state);
  };

  const history = useHistory();
  const handleDeposit = (typeDechet, address, commune, latitude, longitude) => {
    setDepositPoint({
      type: typeDechet,
      adr: address,
      city: commune,
      lat: latitude,
      lng: longitude,
    });
    setUserLoc({
      lat: center.lat,
      lng: center.lng,
    });
    history.push('/deposit');
  };

  const srcAvatar = localStorage.getItem('avatar');
  const pseudoUser = localStorage.getItem('pseudo');

  return (
    <div>
      {!center.loaded ? (
        <div>
          <Header />
          <div className="formpostal">
            <p className="p-geoloc">
              Pour afficher la carte, vous pouvez au choix :
            </p>
            <ul>
              <li>- autoriser la géolocalisation</li>
              <li>- renseigner un code postal</li>
            </ul>
            <label className="label" htmlFor="cp">
              <input
                className="input-postal-code"
                placeholder="Code Postal.."
                type="text"
                name="cp"
                id="cp"
                value={cp}
                onChange={(e) => setCp(e.target.value)}
              />
            </label>
            <br />
            <button
              className="btn-form"
              type="button"
              onClick={() => handleCpSubmit()}
            >
              Valider
            </button>
            <p className="p-geoloc">{msgHelp}</p>{' '}
          </div>
        </div>
      ) : (
        <MapContainer center={center} zoom={ZOOM_LEVEL} tap={false}>
          <LayersControl position="bottomleft">
            <LayersControl.BaseLayer name="Colorful">
              <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="http://c.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Transports dark">
              <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey=dc257dbcfad448daa0ec83a930eb1425"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Transports">
              <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=dc257dbcfad448daa0ec83a930eb1425"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Pistes cyclables">
              <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked name="Default">
              <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          {buttonFilter ? (
            <div className="button-position">
              <button
                type="button"
                className="button-Filter"
                onClick={toggleActive}
              >
                <img className="filterLogo" alt="" src={filterLogo} /> Filter
              </button>
            </div>
          ) : (
            <div className="container">
              <div className="button-Filter-list">
                <button
                  type="button"
                  className="button-close-logo"
                  onClick={toggleActive}
                >
                  <img className="closeLogo" alt="" src={crossLogo} />
                  Close
                </button>
                <div className="inputList">
                  <form className="checkbox">
                    <label htmlFor="vehicle1">
                      <input
                        type="checkbox"
                        className="verre-checkbox"
                        value="verre"
                        checked={filtreDechet.verre}
                        onChange={verreFilter}
                      />
                      Verres
                    </label>
                    <img
                      src={pinsVerreLogo}
                      alt="verrepin"
                      className="pinsVerre"
                    />
                  </form>
                  <form className="checkbox">
                    <label htmlFor="vehicle1">
                      <input
                        type="checkbox"
                        className="verre-checkbox"
                        name="vehicle1"
                        value="trisac"
                        checked={filtreDechet.trisac}
                        onChange={trisacFilter}
                      />
                      Trisacs
                    </label>
                    <img
                      src={pinsTrisacLogo}
                      alt="trisacpin"
                      className="pinsTrisac"
                    />
                  </form>
                  <form className="checkbox">
                    <label htmlFor="vehicle1">
                      <input
                        type="checkbox"
                        className="verre-checkbox"
                        name="vehicle1"
                        value="cartons"
                        checked={filtreDechet.cartons}
                        onChange={cartonsFilter}
                      />
                      Cartons
                    </label>
                    <img
                      src={pinsCartonLogo}
                      alt="cartonpin"
                      className="pinsCarton"
                    />
                  </form>
                  <form className="checkbox">
                    <label htmlFor="vehicle1">
                      <input
                        type="checkbox"
                        className="verre-checkbox"
                        name="vehicle1"
                        value="compost"
                        checked={filtreDechet.compost}
                        onChange={compostFilter}
                      />
                      Composts
                    </label>
                    <img
                      src={pinsCompostLogo}
                      alt="compostpin"
                      className="pinsCompost"
                    />
                  </form>
                  <form className="checkbox">
                    <label htmlFor="vehicle1">
                      <input
                        type="checkbox"
                        className="verre-checkbox"
                        name="vehicle1"
                        checked={filtreDechet.dechette}
                        onChange={dechetteFilter}
                      />
                      Déchetteries
                    </label>
                    <img
                      src={pinsDechetteLogo}
                      alt="dechettepin"
                      className="pinsDechette"
                    />
                  </form>
                  <form className="checkbox">
                    <label htmlFor="vehicle1">
                      <input
                        type="checkbox"
                        className="verre-checkbox"
                        name="vehicle1"
                        value="ordures"
                        checked={filtreDechet.ordures}
                        onChange={orduresFilter}
                      />
                      Ordures ménagères
                    </label>
                    <img
                      src={pinsOrduresLogo}
                      alt="ordurenpin"
                      className="pinsOrdure"
                    />
                  </form>
                  <form className="select-checkbox">
                    <label htmlFor="vehicle1">
                      <input
                        type="checkbox"
                        className="verre-checkbox"
                        name="unselect"
                        value="unselect"
                        checked={selectAll}
                        onChange={unSelect}
                      />
                      {selectAll ? 'Unselect All' : 'Select All'}
                    </label>
                  </form>
                </div>
              </div>
            </div>
          )}
          <Marker position={center} icon={pins.bluePin}>
            <Popup>
              <p style={{ textAlign: 'center' }}>{pseudoUser}</p>
              <img
                style={{ borderRadius: '50%' }}
                className="frog"
                src={srcAvatar}
                alt="blue frog"
              />
            </Popup>
          </Marker>
          <MarkerClusterGroup
            showCoverageOnHover={false}
            spiderfyDistanceMultiplier={1}
          >
            {column.map((eachColumn) => (
              <Marker
                key={eachColumn.fields.id_colonne}
                position={[
                  eachColumn.fields.geo_shape.coordinates[1],
                  eachColumn.fields.geo_shape.coordinates[0],
                ]}
                icon={(() => {
                  switch (eachColumn.fields.type_dechet) {
                    case 'Verre':
                      return pins.verrePin;
                    case 'Trisac':
                      return pins.trisacPin;
                    case 'Papier-carton':
                      return pins.cartonPin;
                    case 'Ordure ménagère':
                      return pins.orduresPin;
                    default:
                      return pins.pinkPin;
                  }
                })()}
              >
                <Popup>
                  <h3>{eachColumn.fields.type_dechet}</h3>
                  <p className="pParagraphe">
                    {eachColumn.fields.adresse}
                    <br />
                    {eachColumn.fields.commune}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      showInMapClicked(
                        eachColumn.fields.geo_shape.coordinates[1],
                        eachColumn.fields.geo_shape.coordinates[0]
                      )
                    }
                  >
                    Y aller
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDeposit(
                        eachColumn.fields.type_dechet,
                        eachColumn.fields.adresse,
                        eachColumn.fields.commune,
                        eachColumn.fields.geo_shape.coordinates[1],
                        eachColumn.fields.geo_shape.coordinates[0]
                      )
                    }
                  >
                    Déposer
                  </button>
                </Popup>
              </Marker>
            ))}
            {compost.map((eachCompost) => (
              <Marker
                key={eachCompost.fields.id}
                position={[
                  eachCompost.geometry.coordinates[1],
                  eachCompost.geometry.coordinates[0],
                ]}
                icon={pins.compostPin}
              >
                <Popup>
                  <h3>Compost, {eachCompost.fields.nom}</h3>
                  <p className="pParagraphe">
                    {eachCompost.fields.adresse}
                    <br />
                    {eachCompost.fields.lieu}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      showInMapClicked(
                        eachCompost.geometry.coordinates[1],
                        eachCompost.geometry.coordinates[0]
                      )
                    }
                  >
                    Y aller
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDeposit(
                        'Compost',
                        eachCompost.fields.adresse,
                        eachCompost.fields.lieu,
                        eachCompost.geometry.coordinates[1],
                        eachCompost.geometry.coordinates[0]
                      )
                    }
                  >
                    Déposer
                  </button>
                </Popup>
              </Marker>
            ))}
            {dechette.map((eachDechette) => (
              <Marker
                key={eachDechette.fields.idobj}
                position={[
                  eachDechette.fields.location[0],
                  eachDechette.fields.location[1],
                ]}
                icon={pins.dechettePin}
              >
                <Popup>
                  <h3>{eachDechette.fields.nom_complet}</h3>
                  <p className="pParagraphe">
                    {eachDechette.fields.adresse}
                    <br />
                    {eachDechette.fields.commune}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      showInMapClicked(
                        eachDechette.fields.location[0],
                        eachDechette.fields.location[1]
                      )
                    }
                  >
                    Y aller
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDeposit(
                        'Compost',
                        eachDechette.fields.adresse,
                        eachDechette.fields.commune,
                        eachDechette.fields.location[0],
                        eachDechette.fields.location[1]
                      )
                    }
                  >
                    Déposer
                  </button>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      )}
    </div>
  );
};

export default CollectMap;
