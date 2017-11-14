import React from 'react'
import ReactDOM from 'react-dom'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store'

import App from './components/App'
import Home from './components/Home'
import Login from './components/Login'
import Search from './components/Search'
import RedirectLogin from './components/Redirect'
import Discover from './components/Discover'
import DiscoverCategory from './components/DiscoverCategory'
import PlaylistDetail from './components/PlaylistDetail'

import './stylesheets/main.scss'

const app_routes = [
  {
    //path: '/stream',
    component: App,
    routes: [
      {
        path: '/me',
        component: Home,
        exact: true
      },
      {
        path: '/discover',
        component: Discover,
        exact: true
      },
      {
        path: '/category/:category',
        component: DiscoverCategory,
        exact: true
      },
      {
        path: '/playlist/:user/:id',
        component: PlaylistDetail,
        exact: true
      },
      {
        path: '/search',
        component: Search,
        exact: false
      }
    ]
  }
]

const RouteWithSubRoutes = route => (
  <Route
    path={route.path}
    render={props => (
      // pass the sub-routes down to keep nesting
      <route.component {...props} routes={route.routes} />
    )}
  />
)

const Root = () => {
  return (
    <Provider store={store}>
      <Router>
        <Switch>
          <Route exact path="/login" component={Login} />
          <Route path="/app" component={RedirectLogin} />
          <Redirect from="/" to="/login" />
          {app_routes.map((route, i) => (
            <RouteWithSubRoutes key={i} {...route} />
          ))}

          <Route component={() => <div>404</div>} />
        </Switch>
      </Router>
    </Provider>
  )
}

if (module.hot) {
  module.hot.accept()
}

ReactDOM.render(<Root />, document.querySelector('#root'))
