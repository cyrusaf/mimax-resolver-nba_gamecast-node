let request = require('request')
let cheerio = require('cheerio')
let sync    = require ('synchronize')

class Player {
  constructor(name, abr, score) {
    this.name  = name
    this.score = score
    this.show_score = true
    if (score == '') {
      this.show_score = false
    }
    this.abr   = abr.toLowerCase()
  }
}

class Game {
  constructor(home, away, in_progress, period_num, game_clock, period_status) {
    this.home          = home
    this.away          = away
    this.in_progress   = in_progress
    this.period_num    = period_num
    this.game_clock    = game_clock
    this.period_status = period_status
    this.url           = null
  }

  static fromUrl(url) {
    // Fetch ID from url
    let matches = /nba\.com\/gametracker\/#\/(\d+)\/([^\/]+)\//g.exec(url)
    if (!matches) {
      throw new Error('Not valid nba.com gametracker URL.')
    }
    let day_id = matches[1]
    let game_url = matches[2]
    let game = Game.fromId(day_id, game_url, url)
    game.url = url

    //console.log(game)
    return game
  }

  static fromId(day_id, game_url) {
    // Fetch game data from nba.com api using id
    let url = `http://data.nba.com/data/5s/json/cms/noseason/scoreboard/${day_id}/games.json`
    let json_str = sync.await(request(url, sync.defers('req', 'body'))).body

    // API returns list of games
    let games = JSON.parse(json_str)['sports_content']['games']['game']

    // Find correct game using day_id and game_url then assign to data
    let data;
    for (let game of games) {
      if (game['game_url'] === `${day_id}/${game_url}`) {
        data = game
        break
      }
    }
    if (data == null) {
      throw new Error("Cannot find game.")
    }

    // Create home and away teams
    let home = new Player(data.home.nickname, data.home.abbreviation, data.home.score)
    let away = new Player(data.visitor.nickname, data.visitor.abbreviation, data.visitor.score)

    // If if game is in progress
    let game_clock    = null
    let period_num    = null
    let period_status = data['period_time']['period_status']
    let in_progress = true
    if (period_status === "Final") {
      in_progress = false

    }
    if (in_progress) {
      game_clock = data['period_time']['game_clock']
      period_num = data['period_time']['period_value']
    }
    return new Game(home, away, in_progress, period_num, game_clock, period_status)
  }
}

module.exports = {
  Player: Player,
  Game: Game
}
