import React, { useEffect, useState, useCallback } from 'react'

import Input from './components/Input'
import useForm from './customHook/useForm'
import { FiMapPin } from 'react-icons/fi'
import api from './Api'
import Loading from './components/Loading'
//import Error from './components/Error'
import Styles from './App.module.css'

const App = () => {
  const cityInput = useForm()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [coords, setCoords] = useState(() => {
    if (window.localStorage.getItem('coords')) {
      return JSON.parse(window.localStorage.getItem('coords'))
    }
    return null
  })

  const [cityWeather, setCityWeather] = useState(() => {
    if (window.localStorage.getItem('cityWeather')) {
      return JSON.parse(window.localStorage.getItem('cityWeather'))
    }
    return null
  })

  const getCoords = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const long = position.coords.longitude
        window.localStorage.setItem('coords', JSON.stringify({ lat, long }))
        setCoords({ lat, long })
      },
      (responseError) => {
        // eslint-disable-next-line
        console.log(responseError.message)
        return false
      }
    )
    setLoading(false)
  }

  const getWeatherByCity = useCallback(async () => {
    window.localStorage.clear()
    setCityWeather(null)
    setCoords(null)
    setError(null)
    if (cityInput.validate()) {
      setLoading(true)
      try {
        const response = await api.get(`/search/?query=${cityInput.value}`)
        if (response.data.length > 0) {
          const cityWoeid = response.data[0].woeid
          const cityWeather = await api.get(`/${cityWoeid}`)
          setCityWeather(cityWeather.data)
        } else {
          setError('Nenhuma informação localizada')
        }
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
  }, [cityInput])

  const getWeatherByCoords = useCallback(async (coords) => {
    setLoading(true)
    setError(null)
    try {
      const cities = await api.get(
        `/search/?lattlong=${coords.lat},${coords.long}`
      )
      const cityWoeid = cities.data[0].woeid
      const cityWeather = await api.get(`/${cityWoeid}`)
      setCityWeather(cityWeather.data)
      setLoading(false)
    } catch (error) {
      setError(error.message)
    }
  }, [])

  useEffect(() => {
    if (coords && !cityWeather) getWeatherByCoords(coords)
  }, [coords, getWeatherByCoords, cityWeather])

  return (
    <>
      <div className={Styles.WrapperTitle}>
        <h1 className={Styles.Title}>Previsão do tempo</h1>
      </div>

      <div className={Styles.WrapperInputs}>
        <div className={Styles.ContainerInputs}>
          <div className={Styles.ContainerInputCity}>
            <Input
              label="Digite uma cidade"
              type="text"
              placeholder="Ex: London, São Paulo"
              {...cityInput}
            />
            <button type="submit" onClick={getWeatherByCity}>
              Buscar
            </button>
          </div>
          <div className={Styles.ContainerLocationOption}>
            <p>Prefere usar sua localização? </p>
            <button onClick={getCoords} className="link-style">
              Localizar agora <FiMapPin size={12} />
            </button>
          </div>
        </div>
      </div>
      <div className={Styles.WrapperResult}>
        {(loading || error || cityWeather) && (
          <div className={Styles.ContainerResult}>
            {loading && <Loading />}
            {error && <p className={Styles.ErrorTitle}>{error}</p>}
            {cityWeather && (
              <>
                <div>{cityWeather.title}</div>
                {cityWeather.consolidated_weather.map((weather, index) => (
                  <div key={index}>{weather.the_temp}</div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default App
