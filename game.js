// Create the canvas element and set its dimensions
var c = document.createElement("canvas");
var ctx = c.getContext("2d");
c.width = window.innerWidth; 
c.height = window.innerHeight-10;
document.body.appendChild(c);
window.addEventListener('resize', () => {
    c.width = window.innerWidth;
    c.height = window.innerHeight - 10;

    // Adjust player position and size based on new canvas size
    player.x = (player.x / (c.width - 10)) * c.width;
    player.y = (player.y / (c.height - 10)) * c.height;

    // Adjust other properties like image size similarly
});

//generates random unique numbers between 0 and 254 in perm array
var perm = [];
while (perm.length < 255){
    while(perm.includes(val = Math.floor(Math.random()*255)));
    perm.push(val);
}

// this basically returns a crazy number which is a value of cosine function, a+(b-a)/2(amplitude)*(1-cos(pi*t));
//responsible for generation of landscapes
var lerp = (a,b,t) => a + (b-a) * (1-Math.cos(t*Math.PI))/2; 
var noise = x=>{
    x = x * 0.01 % 254;
    return lerp(perm[Math.floor(x)], perm[Math.ceil(x)], x - Math.floor(x));
}

function calculateBgColor(elapsedTime){//this function changes the colour of the sky
    var timeFraction = (elapsedTime % dayNightDuration) / dayNightDuration;

    // Define colors for day and night
    var dayColor = { r: 173, g: 216, b: 230 }; // Light blue
    var nightColor = { r: 25, g: 25, b: 112 }; // Dark blue

    // dertermine RGB components based on timeFraction; same function which generates the landscape
    var bgColor = {
        r: Math.round(lerp(nightColor.r, dayColor.r, timeFraction)),
        g: Math.round(lerp(nightColor.g, dayColor.g, timeFraction)),
        b: Math.round(lerp(nightColor.b, dayColor.b, timeFraction)),
    };
    //console.log(bgColor)
    return bgColor;
}

var Player=function(){

    this.x=c.width/2;
    this.y=0;
    //starting position of player

    this.ySpeed=0;
    this.rot=0;
    this.rSpeed=0;
    this.img=new Image();
    this.img.src="bike.png"//add the bike image

    this.draw=function(){//responsible for positioning of the bike on the canvas
        var p1= c.height - noise(t + this.x)*0.25;
        var p2=c.height - noise(t+5 + this.x)*0.25;

        var grounded=false;
        if(p1-12 > this.y)//to check if the player is above the ground, increase the ycomponent of speed
        {
            this.ySpeed+=0.1;//this is gravity!
        }
        else
        {   //if the player is on ground
            this.ySpeed-=this.y-(p1-12);
            this.y=p1-12;
            grounded=true;
        }

        // Calculate the angle of the player based on the difference in heights
        var angle= Math.atan2((p2-12) - this.y, (this.x+5) - this.x);
        this.y+=this.ySpeed;// Update the player's vertical position based on ySpeed

        // Check conditions to determine if the player is not playing or if they crashed
        if(!playing || grounded && Math.abs(this.rot) > Math.PI * 0.5)//crashed basically if the angle is >180
        {
            playing=false;//not playing
            k.ArrowUp=1;//keep the arrowUp key pressed
            this.x-=speed*5;//speed for removing the bike out of frame, to restart
            audio1.play();//play crash audio
        }

        
        if(grounded && playing)//not crashed yet
        {
            this.rot-=(this.rot-angle)*0.65;//adjust the players position
            this.rSpeed=this.rSpeed-(angle-this.rot);//adjust the speed of rotation
        }

        this.rSpeed+=(k.ArrowLeft-k.ArrowRight)*0.05;//rotation speed calculated by left and right arrows
        this.rot-=this.rSpeed*0.05;//update thhe calculated rotation

        // Ensure that the player's rotation stays within the range of -π to π while the buttons are not pressed
    if (this.rot>Math.PI)
    {
        this.rot=-Math.PI;
    } 
    if (this.rot< -Math.PI)
    {
        this.rot=Math.PI;
    } 

        ctx.save();//save the context
        ctx.translate(this.x, this.y);//move the canvas according to player
        ctx.rotate(this.rot);//rotate the bike
        ctx.drawImage(this.img,-35,-35,50,50);//placement and size of bike
        ctx.restore();//restore the conditions after starting again
    }
}

// Initialize variables for time, speed, gameplay, Audio and player
var player=new Player();//instance of a player; object
var t=0;
var speed=0;
var playing=true;
var k={ArrowUp:0, ArrowDown:0, ArrowLeft:0, ArrowRight:0};
var startTime=Date.now();
var dayNightDuration=15000; // 15 seconds   
var audio1=new Audio('1.mp3');
var isKeyPressed=false;

function loop()
{
    //console.log(isKeyPressed);
    speed -= (speed - (k.ArrowUp - k.ArrowDown)) * 0.01;
    t += 10 * speed;
    //_______sky__________________
    var elapsedTime = Date.now() - startTime;// Calculate a value between 0 and 1 based on the elapsed time and duration
    var bgColor = calculateBgColor(elapsedTime);//gives the rgb values of day and night
    ctx.fillStyle = `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`;//accquired values filled up
    ctx.fillRect(0, 0, c.width, c.height);//size of the sky which needs to be coloured

//____________mountains_____________    
    ctx.fillStyle = "rgba(0,0,0,0.25)";//the color of mountains behind the sky, 25% opacity 
    ctx.beginPath();//this is the path for mountains
    ctx.moveTo(0, c.height);
    for (let i=0; i<c.width; i++)
    {
        ctx.lineTo(i, c.height*0.8 - noise(t + i*5) * 0.25);//structure of mountains behind the sky
    }
    ctx.lineTo(c.width, c.height);
    ctx.fill();

//___________construction of ground_________________________
    
    ctx.beginPath();//start a path for the ground
    ctx.fillStyle = "#444";//this is ground color
    ctx.moveTo(0, c.height);
    for (let i=0; i<c.width; i++)
        ctx.lineTo(i, c.height - noise(t + i) * 0.35);
    ctx.lineTo(c.width, c.height);
    ctx.fill();

//_________________create the player as described in the draw function___________
    player.draw();
    if(player.x < 0)//if the player is out of frame
    {
        //audio1.play();
        restart();
    }
    requestAnimationFrame(loop);// Request the next frame
}

onkeydown= (d)=>k[d.key]=1;
onkeyup= (d)=>k[d.key]=0;

function restart()
{
    player=new Player();
    t=0;
    speed=0;
    playing=true;
    k={ArrowUp:0, ArrowDown:0, ArrowLeft:0, ArrowRight:0};
}

loop();//start the game

//printout the instructions
var instructions = document.createElement("div");
instructions.style.position = "absolute";
instructions.style.top = "10px"; // Adjust this value as needed
instructions.style.left = "10px"; // Adjust this value as needed
instructions.style.color = "#fff";
instructions.style.fontFamily = "raleway";
instructions.style.fontSize = "26px";
instructions.style.zIndex = "9999"; // Ensure it appears on top of the canvas
instructions.innerHTML = "[up] [down] = accelerate <br> [Left] [Right] = rotate";
document.body.appendChild(instructions);
