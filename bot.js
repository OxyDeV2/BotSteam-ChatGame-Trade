const SteamUser = require('steam-user');
const config = require('./config.json');
var SteamTotp = require('steam-totp');
const SteamCommunity = require ('Steamcommunity');
const TradeOfferManager = require ('steam-tradeoffer-manager');
const randomInt = require('random-int');
const market = require('steam-market-pricing');

const client = new SteamUser();
const community = new SteamCommunity ();

const manager = new TradeOfferManager ({
    
    steam: client,
    community: community,
    language: 'fr'
});

//Options de Login (Mdp , Username , OTP)

const logOnOptions = {
    accountName: config.username,
    password: config.password,
    TwoFactorCode : SteamTotp.generateAuthCode('')
};


var check = function(){
    if(1 == 1){
        setTimeout(check, 3000); // check again in a second// run when condition is met
    }
    else {
        setTimeout(check, 3000); // check again in a second
    }
}





//Connection

client.logOn(logOnOptions);

//Si la connection est valide , un message de bienvenue apparait , et le bot simule de jouer CS:GO et avec un statut en ligne.

client.on('loggedOn', () => {
    console.log('Bienvenue sur la console de votre Steam-bot by OxyDe. Vous êtes maintenant connecté.');
    client.setPersona(SteamUser.EPersonaState.Online);
    client.gamesPlayed(730);
});


client.on('accountLimitations', function (limited, communityBanned, locked, canInviteFriends) {
    if (limited) {
        // More info: https://support.steampowered.com/kb_article.php?ref=3330-IAGK-7663
        console.log("Votre compte est limité. Vous ne pouvez pas inviter d'amis, utiliser le marché, ouvrir un groupe, ou utiliser les web API.");
    }
    if (communityBanned){
        // More info: https://support.steampowered.com/kb_article.php?ref=4312-UOJL-0835
        // http://forums.steampowered.com/forums/showpost.php?p=17054612&postcount=3
        console.log("Votre compte est banni de la communauté steam (VAC).");
        // I don't know if this alone means you can't trade or not.
    }
    if (locked){
        // Either self-locked or locked by a Valve employee: http://forums.steampowered.com/forums/showpost.php?p=17054612&postcount=3
        console.log("Votre compte est bloqué. Vous ne pouvez pas trade/acheter/offrir des items, jouer sur les serveurs VAC, ou accéder a la communauté Steam.  Extinction du processus...");
        process.exit(1);
    }
    if (canInviteFriends){
        // This could be important if you need to add users.  In our case, they add us or just use a direct tradeoffer link.
        console.log("Votre compte n'est pas habilité à envoyer/accepter des demandes d'amis.");
    }
});




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////// Jeux , commandes ///////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//      +roll : Affiche un numéro entre 1 et 100 aléatoirement. 

//client.on("friendMessage", function(steamID, message) {
  //  if ( message.substring(  0, 5 ) === "+roll" ) {
    //    number = parseInt( message.substring( 6 ));
      //  if (number <= 100 && number >= 0){
        //    var random = (randomInt(0, 100));
          //  client.chatMessage(steamID,"Tirage : " + random);
            //client.chatMessage(steamID,"Votre choix : " + number); 
           // console.log( "[" + steamID + "] =>" +"Tirage : " + random );
            //if ( number == random ) {
            //console.log("[" + steamID + "] =>" +" Remporte " );
            //client.chatMessage(steamID,"Bravo vous avez gagner");
        //    }
         //   else {
          //      console.log("[" + steamID + "] =>" +" Perd " );
           //     client.chatMessage(steamID,"Vous avez perdu !");
           // }
       // }
       // else {
       //     client.chatMessage(steamID,"Nombre invalide. Choisissez un nombre entre 0 et 100. +roll <number>" );   
       // }
   // }
// });



client.on("friendMessage", function(steamID, message) {
    if (message == "+help") 

    {
        client.chatMessage(steamID,"Commands : \n +roll : Choose a number between 0-100 and bet one skin of your inventory. 50x bet multiplier. +roll <number> \n +trade : Send a trade offer \n +checkinventory : Check what's and wich items is in your inventory");
    } 

    else if (message == "+checkinventory")

    {
        client.chatMessage(steamID,"Voici ton inventaire : ");
    }

    else if (message == "+trade")
    {
        client.chatMessage(steamID, "https://steamcommunity.com/tradeoffer/new/?partner=308413079&token=qMQ0Tys0");
    }

    else
    {
        client.chatMessage(steamID, "Invalid command. Type +help for show all commands.\nCommmande invalide. Tapez +help pour afficher toutes les commandes.");
    }
});


//Créer un cookie de session réutilisable.

client.on('webSession', (sessionid, cookies) => {
    manager.setCookies(cookies);

    community.setCookies(cookies);
    community.startConfirmationChecker(20000, config.identitySecret);

});


// Evenements : Liste les items donnés.

manager.on('newOffer', function(offer) {
	for (var i = 0; i < offer.itemsToGive.length; i++) {
        console.log("Items à donner #" + i + " : " + offer.itemsToGive[i].market_hash_name);
        market.getItemPrice(730, offer.itemsToGive[i].market_hash_name).then(item => console.log(item.median_price));
     }
    });

// Evenements : Liste les items reçus.

manager.on('newOffer', function(offer) {
	for (var i = 0; i < offer.itemsToReceive.length; i++) {
        console.log("Items à recevoir #" + i + " : " + offer.itemsToReceive[i].market_hash_name);
        market.getItemPrice(730, offer.itemsToReceive[i].market_hash_name).then(item => console.log(item.median_price));
    }
    });




//Fonction de refus d'offre steam.

function declineOffer(offer) {
	offer.decline((err) => {
		community.checkConfirmations();
		console.log("Offre refusée.");
		if (err) console.log("Erreur durant le refus de l'échange.");
	});
}

//Fonction d'acceptation d'offre steam.

function acceptOffer(offer) {
	offer.accept((err) => {
		community.checkConfirmations();
		console.log("Offre acceptée.");
		if (err) console.log("Erreur durant l'acceptation de l'échange.");
	});
}

//Desactive la confirmation de steamguard pour l'échange.

client.setOption("promptSteamGuardCode", false);

// Evenement de trade : Si le nombre d'items du bot est superieur l'échange est annulé ,
// Si les items donnés par le bot sont égale a 0 et que les items donnés au bot sont superieur à 0 alors , échange accépté.

manager.on('newOffer', (offer) => {
    check();
    if (offer.itemsToGive.length == 0 && offer.itemsToReceive.length > 0) {
        acceptOffer(offer);
    } else {
    declineOffer(offer);
   }
     
});


// Porte monnaie steam

client.on('wallet', function (hasWallet, currency, balance) {
    if (hasWallet) {
        console.log("Vous avez "+ SteamUser.formatCurrency(balance, currency) +" dans le porte monnaie.");
    } else {
        console.log("Votre Steam wallet est vide.");
    }
});

// Requete de groupe

client.on('groupRelationship', function(sid, relationship) {
    if (relationship == SteamUser.EClanRelationship.Invited) {
        console.log("Nous sommes invité dans le groupe #"+sid);
        client.respondToGroupInvite(sid, true);
    }
})
 
//Demande d'ami + génération du message dés l'acceptation de la demande

client.on('friendRelationship', function (steamID, relationship) {
    // If it's a new friend request...
    if (relationship == SteamUser.EFriendRelationship.RequestRecipient) {
        console.log('[' + steamID + '] Requête acceptée ');
        // Accept!
        client.addFriend(steamID);
        client.chatMessage(steamID, "#Boup-bip# Je suis BOT Trade 18. #Boup-bip#");
    } // If they removed us, just log it.
    else if (relationship == SteamUser.EFriendRelationship.None) {
        console.log('[' + steamID + '] Vous a supprimé de ses amis.');
    }

});

// Evenements qui s'active quand on vas recevoir un message de n'importe quel ami. Nous allons recevoir un message et cela sera placé dans les logs de la console
client.on('friendMessage', function(steamID, message)
{
	console.log("[Message] => " + steamID.getSteam3RenderedID() + ": " + message);
});



  ///////////////////////////////////////////////////////////////////////////////////////////
 //////                               BLOC NOTE : TEST                               ///////
///////////////////////////////////////////////////////////////////////////////////////////

// 
var weapons = ['M4A4', 'AK-47'];
var test = market.getItemPrice(730, 'MP9 | Storm (Minimal Wear)').then(item => console.log(item.median_price));
var newLength = weapons.push(test);
newLength;
//market.getItemPrice(730, 'AK-47 | Elite Build (Well-Worn)').then(item => console.log(item.median_price));

console.log('Nombre de weapons : ' + weapons.length);
weapons.forEach(function(item, index, array) {
    console.log(item, index);
});
// ?