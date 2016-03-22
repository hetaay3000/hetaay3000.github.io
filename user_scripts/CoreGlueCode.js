"use strict";
/*
 Copyright (C) 2012-2016 Grant Galitz

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var IodineGUI = {
    Iodine:null,
    Blitter:null,
    timerID: null,
    startTime:(+(new Date()).getTime()),
    mixerInput:null,
    defaults:{
        sound:true,
        volume:1,
        skipBoot:false,
        toggleSmoothScaling:true,
        toggleDynamicSpeed:false,
        toggleOffthreadGraphics:true,
        toggleOffthreadCPU:(navigator.userAgent.indexOf('AppleWebKit') == -1),
        keyZones:[
            //Use this to control the key mapping:
            //A:
            [90, 74],
            //B:
            [88, 81, 89],
            //Select:
            [16],
            //Start:
            [39],
            //Right:
            [37],
            //Left:
            [65],
            //Up:
            [38],
            //Down:
            [40],
            //R:
            [65],
            //L:
            [83]
        ]
    }
};
window.onload = function () {
    //Populate settings:
    registerDefaultSettings();
    //Initialize Iodine:
    registerIodineHandler();
    //Initialize the timer:
    registerTimerHandler();
    //Initialize the graphics:
    registerBlitterHandler();
    //Initialize the audio:
    registerAudioHandler();
    //Register the save handler callbacks:
    registerSaveHandlers();
    //Register the GUI controls.
    registerGUIEvents();
    //Register GUI settings.
    registerGUISettings();
    //crushit();

    
}
function registerIodineHandler() {
    try {
        /*
        We utilize SharedArrayBuffer and Atomics API,
        which browsers prior to 2016 do not support:
        */
        if (typeof SharedArrayBuffer != "function" || typeof Atomics != "object") {
            throw null;
        }
        else if (!IodineGUI.defaults.toggleOffthreadCPU) {
            //Try starting Iodine normally, but initialize offthread gfx:
            IodineGUI.Iodine = new IodineGBAWorkerGfxShim();
        }
        else {
            //Try starting Iodine in a webworker:
            IodineGUI.Iodine = new IodineGBAWorkerShim();
            //Have to manually capture the error if CPU thread is in a webworker:
            IodineGUI.Iodine.attachPlayErrorHandler(resetPlayButton);
            //In order for save on page unload, this needs to be done:
            addEvent("beforeunload", window, registerBeforeUnloadHandler);
        }
    }
    catch (e) {
        //Otherwise just run on-thread:
        IodineGUI.Iodine = new GameBoyAdvanceEmulator();
    }
}
function registerBeforeUnloadHandler(e) {
    IodineGUI.Iodine.pause();
    document.getElementById("pause").className = "hide";
    document.getElementById("play").className = "show";
    if (e.preventDefault) {
        e.preventDefault();
    }
    return "IodineGBA needs to process your save data, leaving now may result in not saving current data.";
}
function registerTimerHandler() {
    var rate = 16;
    IodineGUI.Iodine.setIntervalRate(rate | 0);
    setInterval(function () {
        //Check to see if web view is not hidden, if hidden don't run due to JS timers being inaccurate on page hide:
        if (!document.hidden && !document.msHidden && !document.mozHidden && !document.webkitHidden) {
            if (document.getElementById("play").className == "hide") {
                IodineGUI.Iodine.play();
            }
            IodineGUI.Iodine.timerCallback(((+(new Date()).getTime()) - (+IodineGUI.startTime)) >>> 0);
        }
        else {
            IodineGUI.Iodine.pause();
        }
    }, rate | 0);
}
function registerBlitterHandler() {
    IodineGUI.Blitter = new GfxGlueCode(240, 160);
    IodineGUI.Blitter.attachCanvas(document.getElementById("emulator_target"));
    IodineGUI.Iodine.attachGraphicsFrameHandler(IodineGUI.Blitter);
}
function registerAudioHandler() {
    var Mixer = new GlueCodeMixer();
    IodineGUI.mixerInput = new GlueCodeMixerInput(Mixer);
    IodineGUI.Iodine.attachAudioHandler(IodineGUI.mixerInput);
}



// Hetaay3000's modifications from http://jsemu2.githun.io/gba repository
var games = {
    "advancewars":"Advance Wars",
    "advancewars2":"Advance Wars 2",
    "aladdin":"Aladdin",
    "alienhominid":"Alien Hominid",
    "bomberman_max2blue":"Bomberman Max 2 - Blue Advance",
    "bomberman_tournament":"Bomberman Tournament",
    "bubblebobble":"Bubble Bobble",
    "croket1":"Croket! - Yume no Banker Survival!",
    "croket2":"Croket! 2 - Yami no Bank to Banqueen",
    "croket3":"Croket! 3 - Granu Oukoku no Nazo",
    "croket4":"Croket! 4 - Bank no Mori no Mamorigami",
    "digimon_racing":"Digimon Racing",
    "dbz_supersonic":"Dragon Ball Z - Supersonic Warriors",
    "drilldozer":"Drill Dozer",
    "earthwormjim":"Earthworm Jim",
    "earthwormjim2":"Earthworm Jim 2",
    "ff1and2":"Final Fantasy 1 & 2 Advance",
    "ff4S":"Final Fantasy IV Advance (Sound Restoration Mod)",
    "ff6":"Final Fantasy VI Advance",
    "final_fantasy_tactics":"Final Fantasy Tactics Advance",
    "fire_emblem":"Fire Emblem",
    "frogger1":"Frogger Advance - The Great Quest",
    "frogger2":"Frogger's Adventures - Temple of the Frog",
    "frogger3":"Frogger's Adventures 2 - The Lost Wand",
    "fzero_gp":"F-Zero - GP Legend",
    "fzero_max":"F-Zero - Maximum Velocity",
    "gamewatch4":"Game & Watch Gallery 4",
    "goldensun":"Golden Sun",
    "gunstar_super_heroes":"Gunstar Super Heroes",
    "hamtaro_heartbreak":"Hamtaro - Ham-Ham Heartbreak",
    "kirbymirror":"Kirby & The Amazing Mirror",
    "kirbynightmare":"Kirby: Nightmare in Dreamland",
    "mariokart":"Mario Kart: Super Circuit",
    "marioparty":"Mario Party Advance",
    "mariopinball":"Mario Pinball Land",
    "megamanbass":"Megaman & Bass",
    "megaman_battle1":"Megaman Battle Network 1",
    "megaman_battle2":"Megaman Battle Network 2",
    "megaman_battle3_blue":"Megaman Battle Network 3 Blue",
    "megaman_battle4_blue":"Megaman Battle Network 4 Blue Moon",
    "megaman_battle4_red":"Megaman Battle Network 4 Red Sun",
    "megaman_battle5":"Megaman Battle Network 5 Team Protoman",
    "megaman_battle6":"Megaman Battle Network 6 Cybeast Falzar",
    "megaman_zero1":"Megaman Zero",
    "megaman_zero2":"Megaman Zero 2",
    "megaman_zero3":"Megaman Zero 3",
    "megaman_zero4":"Megaman Zero 4",
    "metalslug":"Metal Slug Advance",
    "metroid_fusion":"Metroid Fusion",
    "momotarou_dentetsu":"Momotarou Dentetsu G Gold Deck wo Tsukure!",
    "monopoly":"Monopoly",
    "monster_force":"Monster Force",
    "mortal_kombat":"Mortal Kombat Advance",
    "pacman_world":"Pacman World",
    "pacman_world2":"Pacman World 2",
    "pokemonflorasky":"Pokemon Flora Sky Rom Hack",
    "pokemonemerald":"Pokemon Emerald",
    "pokemongreen":"Pokemon Leaf Green",
    "mysteryred":"Pokemon Mystery Dungeon Red",
    "pokemonruby":"Pokemon Ruby",
    "pokemonsapphire":"Pokemon Sapphire",
    "pokemonred":"Pokemon Fire Red",
    "gba_video_pokemon_1":"Pokemon Video Pak 1",
    "gba_video_pokemon_2":"Pokemon Video Pak 2",
    "gba_video_pokemon_3":"Pokemon Video Pak 3",
    "gba_video_pokemon_4":"Pokemon Video Pak 4",
    "sonic_advance":"Sonic Advance",
    "sonic_advance2":"Sonic Advance 2",
    "sonic_advance3":"Sonic Advance 3",
    "sonicbattle":"Sonic Battle",
    "supermonkeyballjr":"Super Monkey Ball Jr",
    "superstar":"Mario & Luigi: Superstar Saga",
    "supermarioadvance":"Super Mario Advance",
    "supermarioadvance2":"Super Mario Advance 2",
    "supermarioadvance3":"Super Mario Advance 3",
    "supermarioadvance4":"Super Mario Advance 4",
    "simpsons":"The Simpsons: Road Rage",
    "sonicpinball":"Sonic Pinball",
    "super_street_fighter_2_turbo_revival":"Super Street Fighter II: Turbo Revival",
    "super_street_fighter_3_alpha":"Super Street Fighter III: Alpha",
    "tales_of_phantasia":"Tales of Phantasia",
    "tak2_staff_of_dreams":"Tak 2: The Staff of Dreams",
    "tetris_worlds":"Tetris Worlds",
    "tmnt":"Teenage Mutant Ninja Turtles",
    "sims_bustin_out":"The Sims: Bustin' Out",
    "sims2":"The Sims 2",
    "spyro_adventure":"Spyro Adventure",
    "spyro_ice":"Spyro: Season of Ice",
    "spyro_flame":"Spyro 2: Season of Flame",
    "turok_evolution":"Turok Evolution",
    "warioland4":"Wario Land 4",
    "wario_ware":"Wario Ware Inc",
    "zelda_past":"The Legend of Zelda: A Link to the Past",
    "zelda_minish":"The Legend of Zelda: The Minish Cap"
};

function nameGame(){
var gamename = "Binaries/" + location.hash.substr(1) + ".gba";
    return gamename;
}

function downloadBIOS(ROMHandler) {
    ROMHandler = attachBIOS;
    var file = downloadFile("Binaries/gba_bios.bin", registerBIOS);
    var files = [file];
try {
                var binaryHandle = new FileReader();
                binaryHandle.onloadend = function () {
                    ROMHandler(this.result);
                }
                binaryHandle.readAsArrayBuffer(files[files.length - 1]);
            }
            catch (error) {
                try {
                    var result = files[files.length - 1].getAsBinary();
                    var resultConverted = [];
                    for (var index = 0; index < result.length; ++index) {
                        resultConverted[index] = result.charCodeAt(index) & 0xFF;
                    }
                    ROMHandler(resultConverted);
                }
                catch (error) {
                    alert("Could not load the processed ROM file!");
                }
            }
        
}


function registerBIOS() {
    //processDownload(this, attachBIOS);
    ////downloadROM(location.hash.substr(1));
}
function downloadROM(gamename) {
    IodineGUI.Iodine.pause();
    writeRedTemporaryText("Downloading " + gamename);
    downloadFile(gamename, registerROM);
}
function registerROM() {
    clearTempString();
    processDownload(this, attachROM);
    if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/iPad/i)) {
        IodineGUI.Iodine.disableAudio();
    }
    //IodineGUI.Iodine.play();
}


