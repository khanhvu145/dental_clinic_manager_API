// var http = require('http');
// var https = require('https');
var https = require('follow-redirects').https;
var fs = require('fs');
var Buffer = require('buffer/').Buffer;
const dotenv = require('dotenv');
dotenv.config();

module.exports = async(phones, content) => {
    var options = {
        'method': 'POST',
        'hostname': '3vlg5v.api.infobip.com',
        'path': '/sms/2/text/advanced',
        'headers': {
            'Authorization': 'App 8fc9434e06456ab7ac0df43c3b6ea4c6-24a0fee3-a591-497d-a06d-0173a48ab962',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        'maxRedirects': 20
    };

    var req = https.request(options, function (res) {
        var chunks = [];
    
        res.on("data", function (chunk) {
            chunks.push(chunk);
        });
    
        res.on("end", function (chunk) {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
        });
    
        res.on("error", function (error) {
            console.error(error);
        });
    });

    var postData = JSON.stringify({
        "messages": [
            {
                "destinations": [
                    {
                        "to": phones
                    }
                ],
                "from": "InfoSMS",
                "text": content
            }
        ]
    });

    req.write(postData);

    req.end();
};

// const ACCESS_TOKEN  = process.env.SPEEDSMS_TOKEN; 

// module.exports = async(phones, content, type, sender) => {
//     var url = 'api.speedsms.vn';
//     var params = JSON.stringify({
//         to: phones,
//         content: content,
//         sms_type: type,
//         sender: sender
//     });

//     var buf = new Buffer(ACCESS_TOKEN + ':x');
//     var auth = "Basic " + buf.toString('base64');
//     const options = {
//         hostname: url,
//         port: 443,
//         path: '/index.php/sms/send',
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': auth
//         }
//     };

//     const req = https.request(options, function(res) {
//         res.setEncoding('utf8');
//         var body = '';
//         res.on('data', function(d) {
//             body += d;
//         });
//         res.on('end', function() {
//             var json = JSON.parse(body);
//             if (json.status == 'success') {
//                 console.log("send sms success")
//             }
//             else {
//                 console.log("send sms failed " + body);
//             }
//         });
//     });

//     req.on('error', function(e) {
//         console.log("send sms failed: " + e);
//     });

//     req.write(params);
//     req.end();

//     return;
// };