(function(){

	// get data for all games based on date. runs onpage load
	this.getGames = function(date){
		// parse selected date to be used in http call 
		var selectedDate = getDate(date);
		// create new http request
		var xhttp = new XMLHttpRequest();
		// http event listener for ready state change
		xhttp.onreadystatechange = function() {
			// if ready state chage check if response successful 
			if(xhttp.readyState == 4 && xhttp.status == 200){
				// parse response text to JSON readable object
				games = JSON.parse(xhttp.responseText);
				// call to display games with array of game objects or show alert if no games
				if (games.data.games){
					displayGames(games.data.games.game);
				} else {
					alert("No MLB games on this day");
				}
			}
		};
		// create GET request to mlb API to retrieve the game data. Selected date data concatonated to url 
		xhttp.open("GET", "http://gdx.mlb.com/components/game/mlb/year_"+selectedDate.year+"/month_"+selectedDate.month+"/day_"+selectedDate.day+"/master_scoreboard.json", true);
		// send request to the server
		xhttp.send();
	}

	// get the selected date and update next and previous date
	var getDate = function(date){
		// set selected date. If no date avail create new from today, else create date from selected date
		var d = (date) ? new Date(date) : new Date();
		// create new date object for next date based on selected date
		var nd = new Date(d);
		// add one day to selected date
		nd.setDate(d.getDate() + 1)
		// create date new date object for previous date based on selected date
		var pd = new Date(d);
		// subtract one day from selected date
		pd.setDate(d.getDate() - 1);
		// create a date object of parsed date data
		var selectedDate = parseDate(d, nd, pd);
		var nextDate = parseDate(nd);
		var prevDate = parseDate(pd);
		//set date content to the DOM
		setDateContent(selectedDate, nextDate, prevDate);
		// return parsed date object
		return selectedDate;
	}

	// parse date to usable object 
	var parseDate = function(d, nd, pd){
		// set locale for month name
		var locale = "en-us";
		// return parsed date
		return {
			"year": d.getFullYear(),
			"month_name": d.toLocaleString(locale, { month: "long" }),
			"month": ((d.getMonth()+1) >= 10) ? (d.getMonth()+1) : '0' + (d.getMonth()+1),
			"day": ((d.getDate()) >=10) ? (d.getDate()) : '0' + (d.getDate()),
			"next": nd,
			"prev": pd
		};
	}

	// set selected date to DOM #game-date element
	var setDateContent = function(curDay, nextDay, prevDay){
		document.getElementById('game-date').textContent = curDay.month_name+" "+curDay.day+", "+curDay.year;
		document.getElementById('prev-date').textContent = "< "+prevDay.month_name+" "+prevDay.day+", "+prevDay.year;
		document.getElementById('next-date').textContent = nextDay.month_name+" "+nextDay.day+", "+nextDay.year+" >";
		// document.getElementById('game-date').innerHTML = "<a href='#' >"+curDay.month_name+" "+curDay.day+", "+curDay.year;
		// document.getElementById('prev-date').innerHTML = "< "+prevDay.month_name+" "+prevDay.day+", "+prevDay.year;
		// document.getElementById('next-date').innerHTML = nextDay.month_name+" "+nextDay.day+", "+nextDay.year+" >";


	}

	// display games from selected date
	var displayGames = function(games){
		// path to mlb logo
		var mlbLogo = "img/mlb-logo.png";
		// get #games element form DOM to build new game elements
		var allGames = document.querySelector("#games");
		// loop through games array to get individual game data
		games.forEach(function(game){
			// create game container div for game elements
			var gameContainer = document.createElement("div");
			// add classes to game container element
			gameContainer.className = "game-container inline-block text-center";
			// set tabindex attribute to help with onkey events progression
			gameContainer.setAttribute("tabindex","0");
			// append game container to #games element
			allGames.appendChild(gameContainer);
			// create element for game title
			var gameTitle = document.createElement("div");
			// add class to game title element
			gameTitle.className = "game-title";
			// create inner HTML p tags with team names from game data
			gameTitle.innerHTML = "<p>"+game.away_team_name+" @ "+game.home_team_name+"</p>";
			// append game title to game container
			gameContainer.appendChild(gameTitle);
			// create container for game image
			var imgContainer = document.createElement("div");
			// add class to image container
			imgContainer.className = "img-container";
			// append image container to game container
			gameContainer.appendChild(imgContainer);
			// create image element with thumbnail from game data or mlb logo
			var gameImg = document.createElement("img");
			// add inline style to image element
			gameImg.style.cssText = "max-width:100%; height:100%;";
			// add errorhandler attribute if image error. Default to mlb logo
			gameImg.onerror = function(){ 
				this.src = mlbLogo;
				this.error = "";
				return true;
			};
			// check if video video_thumbnails in game data
			if(game.video_thumbnails){
				// loop through video thumbnails
				game.video_thumbnails.thumbnail.forEach(function(img){
					// if video_thumbnail scenario has value of 7 set to img src
					if(img.scenario === "7"){
						gameImg.src = img.content;
					} 
				});
			} else {
				// if no video thumbnails in game data set to mlb logo
				gameImg.src = mlbLogo;
			}
			// append image to image container
			imgContainer.appendChild(gameImg);
			// create container for game description
			var gameDesc = document.createElement("div");
			// add class to game description element
			gameDesc.className = "game-desc";
			// create inner HTML elements based on game status
			gameDesc.innerHTML = checkGameStatus(game);
			// append game description to game container
			gameContainer.appendChild(gameDesc);

		});
		// once all game elements have been created call function to set game focus
		setGameActive();
	}

	// function to check game status and return game desc elements with relevent game data
	var checkGameStatus = function(game){
		// if game status Preview or Pre-Game, the game has not started. Return game start time in EST 
		if(game.status.status == 'Preview' || game.status.status == 'Pre-Game'){
			return "<p>"+game.time+" "+game.ampm+" EST</p>";
		// if game is in progress return each team current score and inning
		} else if(game.status.status == 'In Progress'){
			return 	"<p>"+game.status.inning_state+" "+game.status.inning+"</p>"+
					"<p>"+game.away_name_abbrev+" "+game.linescore.r.away+"</p>"+
					"<p>"+game.home_name_abbrev+" "+game.linescore.r.home+"</p>";
		// if game final or game over return score and fina inning count
		} else if(game.status.status == 'Final' || game.status.status == 'Game Over'){
			return 	"<p>"+game.away_name_abbrev+" "+game.linescore.r.away+"</p>"+
					"<p>"+game.home_name_abbrev+" "+game.linescore.r.home+"</p>"+
					"<p>"+game.status.inning_state+" "+game.status.status+"</p>";
		// else return current game status
		} else {
			return 	"<p>"+game.status.status+"</p>";			
		}
	}

    // function to set game container focus and update event listener based on individual game
    var setGameActive = function(){
    	// get all game nodes from DOM and set to gamearr object
    	this.gameArr = document.getElementsByClassName("game-container");
    	// get count of all games based on total nuber or obj in gamearr and reduce by one
    	this.arrLength = this.gameArr.length-1;
    	// set inital game index to 0
    	this.gameIndex = 0;
    	// set inital game based on index to current game
    	this.curGame = this.gameArr[gameIndex];
    	// set focus to the game element
    	this.curGame.focus();
    	// update event listener
    	eventListener(this.curGame, this.gameIndex, this.gameArr, this.arrLength);
	}
    // function to set game container focus and update event listener based on right keypress
	var gameArrowRight = function(curGame, gameIndex, gameArr, arrLength){
		// set variables for current game
		this.curGame = curGame;
		this.gameIndex = gameIndex;
		this.gameArr = gameArr;
		this.arrLength = arrLength;
		// on right arrow keydown check to see if element has next sibling for focus
		if(this.curGame.nextSibling){
			// set focus on element and reduce game index by 1 and set to current game
			this.curGame.nextSibling.focus();
			this.gameIndex++;
			this.curGame = this.gameArr[this.gameIndex];
		}else{
			// set game index to last element in game array and update currentgame and focus
			this.gameIndex = 0;
			this.curGame = this.gameArr[this.gameIndex];
			this.curGame.focus();
		}
		// update event listener
    	eventListener(this.curGame, this.gameIndex, this.gameArr, this.arrLength);	
	}

	var gameArrowLeft = function(curGame, gameIndex, gameArr, arrLength){
		// set variables for current game
		this.curGame = curGame;
		this.gameIndex = gameIndex;
		this.gameArr = gameArr;
		this.arrLength = arrLength;
		// on left arrow keydown check to see if element has previous sibling for focus
		if(this.curGame.previousSibling){
			// set focus on element and reduce game index by 1 and set to current game
			this.curGame.previousSibling.focus();
			this.gameIndex--;
	    	this.curGame = this.gameArr[this.gameIndex];
		} else {
			// set game index to last element in game array and update currentgame and focus
			this.gameIndex = this.arrLength;
	    	this.curGame = this.gameArr[this.gameIndex];
			this.curGame.focus();
		}
		// update event listener
    	eventListener(this.curGame, this.gameIndex, this.gameArr, this.arrLength);	
	}

	var arrowUp = function(dir){
		this.navArr = document.getElementsByClassName("nav-date");
		this.navArr[dir].focus();
	}

	var changeDates = function(event){
		var date = event.target.innerText;
		var gamesContainer = document.getElementById("games");
		while (gamesContainer.firstChild) {
			gamesContainer.removeChild(gamesContainer.firstChild);
		}
		getGames(date);
	}

	var eventListener = function(curGame, gameIndex, gameArr, arrLength){
		var up = false;
		this.curGame = curGame;
		this.gameIndex = gameIndex;
		this.gameArr = gameArr;
		this.arrLength = arrLength;
    	// create keydown event listener for keyboard actions
		window.addEventListener("keydown", function (event) {
			// prevent event handler defaults
			if (event.defaultPrevented) {
				return;
			}
			// check if keydown event key was pressed
			switch (event.code) {
				case "ArrowDown":
					up = false;
					setGameActive();
					break;
				case "ArrowUp":
					up = true;
					arrowUp(0);
					break;
				case "ArrowLeft":
					if(up){
						arrowUp(0);
					} else {
				    	gameArrowLeft(this.curGame, this.gameIndex, this.gameArr, this.arrLength);
					}
					break;
				case "ArrowRight":
					if(up){
						arrowUp(1);
					} else {
				    	gameArrowRight(this.curGame, this.gameIndex, this.gameArr, this.arrLength);
					}
					break;
				case "Enter":
					if(up){
						changeDates(event);
					}
					break;
				default:
					return;
			}
			// prevent default after eventhandler has fired
			event.preventDefault();
		}, true);
    }
    

})();