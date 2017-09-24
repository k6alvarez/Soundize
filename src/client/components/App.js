import React, { Component } from 'react'
import { Link } from 'react-router'
var SpotifyWebApi = require('spotify-web-api-node')
var spotifyApi = new SpotifyWebApi()

import { browserHistory } from 'react-router'

import Nav from './Nav'
import MusicBar from './MusicBar'

class App extends Component {
  state = {
    token: '',
    user: '',
    playlists: '',
    privatePlaylists: '',
    featuredPlaylists: '',
    tracklist: '',
    activeTrack: '',
    playing: false,
    playedTime: 0,
    seeking: false,
    displayMusicBar: false,
    activePlaylist: '',
    latestPlayed: [],
    queuedTracks: [],
    activeTracklist: '',
    activeTrackIndex: ''
  }

  componentDidMount() {
    console.log(localStorage.getItem('token'))
    if (
      !localStorage.getItem('token') ||
      (localStorage.getItem('token') !==
        this.props.location.hash.slice(14, -34) &&
        this.props.location.hash)
    ) {
      console.log('Ny token')
      let newHash = this.props.location.hash.slice(14, -34)
      localStorage.setItem('token', newHash)
    }
    spotifyApi.setAccessToken(localStorage.getItem('token'))
    this.getMe()
  }
  getPlaylists() {
    spotifyApi.getUserPlaylists(this.state.user.id).then(data => {
      this.onClickPlaylist(data.body.items[0].owner.id, data.body.items[0].id)
      this.setActivePlaylist(data.body.items[0].id)
      this.getPrivatePlaylists(data.body.items)
      this.setState({ playlists: data.body.items }, () =>
        browserHistory.replace('/app/stream')
      )
    }, function(err) {
      console.log('Something went wrong getting playlists!', err)
    })
    this.getFeaturedPlaylists(new Date().toISOString())
  }
  getPrivatePlaylists = playlists => {
    let privatePlaylists = []
    playlists.map(playlist => {
      if (
        playlist.collaborative === true ||
        playlist.owner.id === this.state.user.id
      ) {
        privatePlaylists.push(playlist)
      }
    })
    this.setState({ privatePlaylists })
  }
  getMe() {
    spotifyApi.getMe().then(data => {
      this.setState({ user: data.body }, () => this.getPlaylists())
    }, function(err) {
      console.log('Something went wrong getting user details!', err)
      browserHistory.replace('/')
    })
  }
  onClickPlaylist = (user, id) => {
    spotifyApi.getPlaylist(user, id).then(data => {
      this.setState({ tracklist: data.body })
      window.scrollTo(0, 0)
    }, function(err) {
      console.log('Something went wrong getting clickedtracklist!', err)
    })
  }
  createPlaylist = (name, desc) => {
    spotifyApi
      .createPlaylist(this.state.user.id, name, { public: true })
      .then(
        data => {
          this.getPlaylists()
        },
        function(err) {
          console.log('Something went wrong!', err)
        }
      )
  }
  unfollowActivePlaylist = (user, playlistId) => {
    spotifyApi.unfollowPlaylist(user, playlistId).then(data => {
      this.getPlaylists()
    }, function(err) {
      console.log('Something went wrong!', err)
    })
  }
  deleteActivePlaylist = id => {
    spotifyApi.unfollowPlaylist(this.state.user.id, id).then(data => {
      this.getPlaylists()
    }, function(err) {
      console.log('Something went wrong!', err)
    })
  }
  addTrackToPlaylist = (ownerId, playlistId, spotifykURI) => {
    spotifyApi
      .addTracksToPlaylist(this.state.user.id, playlistId, [spotifyURI])
      .then(
        data => {
          console.log('Added tracks to playlist!')
        },
        function(err) {
          console.log('Something went wrong!', err)
        }
      )
  }
  addTrackToQueue = track => {
    this.setState({ queuedTracks: [...this.state.queuedTracks, track] })
  }
  removeTrackFromPlaylist = (ownerId, playlistId, spotifyURI) => {
    var tracks = [{ uri: spotifyURI }]
    spotifyApi
      .removeTracksFromPlaylist(ownerId, playlistId, tracks)
      .then(
        data => {
          this.setActivePlaylist(playlistId)
          spotifyApi.getPlaylist(ownerId, playlistId).then(data => {
            this.setState({ tracklist: data.body })
          }, function(err) {
            console.log('Something went wrong getting tracklist!', err)
          })
          console.log('Track removed from playlist!')
        },
        function(err) {
          console.log('Something went wrong!', err)
        }
      )
  }
  getFeaturedPlaylists = time => {
    spotifyApi
      .getFeaturedPlaylists({
        limit: 5,
        offset: 0,
        country: 'SE',
        locale: 'sv_SE',
        timestamp: time
      })
      .then(
        data => {
          this.setState({ featuredPlaylists: data.body.playlists.items })
        },
        function(err) {
          console.log('Something went wrong!', err)
        }
      )
  }
  getTrackAnalysis = id => {
    spotifyApi.getAudioAnalysisForTrack(id).then(
      function(data) {
        console.log(data.body)
      },
      function(err) {
        done(err)
      }
    )
  }
  playNextTrack = () => {
    let nextTrack
    let newQueuedTracks = []
    if (this.state.queuedTracks.length > 0) {
      nextTrack = this.state.queuedTracks[0]
      this.state.queuedTracks.map((track, index) => {
        if (index !== 0) {
          newQueuedTracks.push(track)
        }
      })
      this.setState({ queuedTracks: newQueuedTracks })
      if (this.state.latestPlayed[0] === nextTrack) {
        this.zeroTrack()
        this.startActiveTrack(nextTrack)
      } else {
        this.setActiveTrack(
          nextTrack,
          this.state.activeTracklist,
          this.state.activeTrackIndex
        )
      }
    } else {
      nextTrack = this.state.activeTracklist.tracks.items[
        this.state.activeTrackIndex + 1
      ].track
      this.setActiveTrack(
        nextTrack,
        this.state.activeTracklist,
        this.state.activeTrackIndex + 1
      )
    }

    if (nextTrack.preview_url === null) {
      return false
    } else {
      this.addTrackToLatestPlayed(nextTrack)
    }
  }
  setActivePlaylist = id => {
    this.setState({ activePlaylist: id })
  }
  setActiveTrack = (track, activeTracklist, index) => {
    if (this.state.activeTrack.id !== track.id) {
      this.setState({
        playedTime: 0,
        activeTrack: track,
        activeTrackIndex: index
      })
    }
    if (this.state.activeTracklist !== activeTracklist) {
      this.setState({ activeTracklist })
    }
  }
  addTrackToLatestPlayed = track => {
    if (this.state.latestPlayed.length > 0) {
      if (this.state.latestPlayed[0].id !== track.id) {
        this.setState({ latestPlayed: [track, ...this.state.latestPlayed] })
      }
    } else {
      this.setState({ latestPlayed: [track] })
    }
  }
  stopActiveTrack = track => {
    this.setState({ playing: false })
  }
  startActiveTrack = track => {
    this.setState({
      playing: true,
      displayMusicBar: true
    })
    this.addTrackToLatestPlayed(track)
  }
  setPlayedTime = playedTime => {
    this.setState({ playedTime: playedTime.played })
  }
  onSeekMouseDown = () => {
    this.setState({ seeking: true })
  }
  onSeekChange = e => {
    this.setState({ playedTime: e })
  }
  onSeekMouseUp = e => {
    this.setState({ seeking: false, playedTime: e })
  }
  zeroTrack = () => {
    this.setState({ playing: false })
  }
  render() {
    const childrenWithExtraProp = React.Children.map(
      this.props.children,
      child => {
        return React.cloneElement(child, {
          playlists: this.state.playlists,
          privatePlaylists: this.state.privatePlaylists,
          featuredPlaylists: this.state.featuredPlaylists,
          tracklist: this.state.tracklist,
          onClickPlaylist: this.onClickPlaylist,
          getTrackAnalysis: this.getTrackAnalysis,
          setActiveTrack: this.setActiveTrack,
          stopActiveTrack: this.stopActiveTrack,
          startActiveTrack: this.startActiveTrack,
          activeTrack: this.state.activeTrack,
          playing: this.state.playing,
          playedTime: this.state.playedTime,
          onSeekMouseDown: this.onSeekMouseDown,
          onSeekChange: this.onSeekChange,
          onSeekMouseUp: this.onSeekMouseUp,
          activePlaylist: this.state.activePlaylist,
          setActivePlaylist: this.setActivePlaylist,
          latestPlayed: this.state.latestPlayed,
          queuedTracks: this.state.queuedTracks,
          createPlaylist: this.createPlaylist,
          me: this.state.user,
          unfollowActivePlaylist: this.unfollowActivePlaylist,
          deleteActivePlaylist: this.deleteActivePlaylist,
          addTrackToPlaylist: this.addTrackToPlaylist,
          addTrackToQueue: this.addTrackToQueue,
          removeTrackFromPlaylist: this.removeTrackFromPlaylist
        })
      }
    )
    return (
      <div>
        <Nav user={this.state.user} />
        {childrenWithExtraProp}
        <MusicBar
          activeTrack={this.state.activeTrack}
          playing={this.state.playing}
          startTrack={this.startActiveTrack}
          stopTrack={this.stopActiveTrack}
          setPlayedTime={this.setPlayedTime}
          playedTime={this.state.playedTime}
          seeking={this.state.seeking}
          onSeekMouseDown={this.onSeekMouseDown}
          onSeekChange={this.onSeekChange}
          onSeekMouseUp={this.onSeekMouseUp}
          zeroTrack={this.zeroTrack}
          displayMusicBar={this.state.displayMusicBar}
          playNextTrack={this.playNextTrack}
        />
      </div>
    )
  }
}

export default App
