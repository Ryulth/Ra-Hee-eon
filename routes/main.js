var location = require("./locationtest.js").location;
var weather = require("./weather_test.js").weather;
var life = require("./weather_test.js").life;
var forecast = require("./weather_test.js").forecast;
var request=require("request");

var users = {};

var mysql= require('mysql');

var connection = mysql.createConnection({
 host : 'xx',
 port : 8080,
 user : 'xx',
 password : 'xx',
 database : 'xx'
});



module.exports = function(app, fs)// 비동기이기 때문에 function끝났을 경우 넘어갈 함수 매개변수 fs로지정
{
   // 키보드
   app.get('/keyboard', function(req, res){// request, response
        fs.readFile( __dirname + "/../data/" + "keyboard.json", 'utf8', function (err, data) {
           console.log( data );
           res.end( data );
        });
    });

   // 메시지
   app.post('/message', function(req,res){
      var result = {};
      var messages = {"message" : {"text" : "왜불러"}};

      console.log(req.body);

      var key = req.body["user_key"];

      if (users[key]) {
         users[key].count++;
         console.log(users);
      } else {
         users[key] = {};
         users[key].count = 1;
         connection.connect();

         users[key].type = null;
      }


      // CHECK REQ VALIDITY
        if(!req.body["user_key"] || !req.body["type"] || !req.body["content"]){
            result["success"] = 0;
            result["error"] = "invalid request";
         res.json(result);
            return;
        }

      //users[key].count 몇번째 질문인지
      //users[key].type users[key].day 사용자가 입력한 내용
      //
       if(users[key].count==1 && !req.body["content"] == "날씨"&&!req.body["content"] == "생활지수"){//첫번째질문, 사용자가 날씨입력
          messages["message"] = {"text" : "다시 입력해 주세요 날씨, 생활지수, 즐겨찾기"};
          users[key].count = 0;
           res.send(messages);

       }
      if(users[key].count==1 && req.body["content"] == "날씨"){//첫번째질문, 사용자가 날씨입력
         users[key].type = '날씨';

         messages["message"] = {"text" : "원하는 날짜를 선택하세요!\n\n\t\t1."+"\t오늘\n"+"\t\t2."+"\t내일\n"+"\t\t3."+"\t모레"};
         res.send(messages);
      }
      else if (users[key].count == 2 && users[key].type =='날씨'){//두번째질문, 전질문에서 날씨입력
         switch(req.body["content"])
         {
            case "1"://오늘
            case "2"://내일날씨
            case "3"://모레날씨
               users[key].day = req.body["content"];
               break;
            default:
                   messages["message"] = {"text" : '잘못 입력했습니다. 다시 입력해주세요.\n\n\t1:\t오늘\n\t2:\t내일\n\t3:\t모레' };
                      users[key].count--;
                      res.send(messages);
                      return;
         }
         messages["message"] = {"text" : '지역을 입력하세요 !' };
            res.send(messages);
      }
      else if (users[key].count ==3 && users[key].type =='날씨'&&users[key].day == 1){//세번째질문, 오늘
            location(req.body["content"],function(lo){
               console.log(lo);
               if(lo==0){
                  messages["message"] = {"text" : '다시입력하세요' };
                    users[key].count--;
                  res.send(messages);
               }

               else{
                  var d = new Date();
                  var info=[req.body["user_key"],users[key].type,req.body["content"],d];
                  console.log(info);
                  connection.query("insert into User (user_key,user_content,location,search_date) value (?,?,?,?)",info,function(err,results){
                      console.log(err);
                      console.log(results);
                  });            //insert user : user_key, user_type, 날짜+지역

                  var r_info = [req.body["user_key"],req.body["content"],users[key].day];
                  console.log(r_info);
                  connection.query("insert into Recent_weather (user_key,location,date_index) value (?,?,?)",r_info,function(err,results){
                      console.log(err);
                      console.log(results);
                  });

                  weather(lo.lat,lo.lng,function(info){
                  console.log(info);

                  messages["message"] =
                     {"text" :
                             '  현재날씨 : ' +info.sky.name+ '\n\n'+
                             '  현재기온 : ' +info.temper.tc+' \n'+
                             '  최저기온 : ' +info.temper.tmin+' \n'+
                             '  최고기온 : ' +info.temper.tmax+' 입니다.'};
                      users[key].count=0;

                     //insert Weather : 날짜,지역,tc,tmax,min,hum,sky

                     var info=[d,req.body["content"],info.temper.tc,info.temper.tmax,info.temper.tmin,info.humidity,info.sky.code];
                     console.log(info);
                     connection.query("insert into Weather (date_,location,tc,tmax,tmin,humidity,sky_code) value (?,?,?,?,?,?,?)",info,function(err,results){
                     console.log(err);
                     console.log(results);

                     });
                     res.send(messages);
                  });
               }
            });
      }
      else if (users[key].count ==3 &&users[key].type =='날씨' &&users[key].day==2){//세번째질문, 내일
         location(req.body["content"],function(lo){
            console.log(lo);
            if(lo==0){
               messages["message"] = {"text" : '다시입력하세요' };
               res.send(messages);
            }
            else{

               var d = new Date();
               d.setDate(d.getDate()+1);
               var info=[req.body["user_key"],users[key].type,req.body["content"],d];
               console.log(info);
               connection.query("insert into User (user_key,user_content,location) value (?,?,?,?)",info,function(err,results){
                   console.log(err);
                   console.log(results);
               });//insert User : user_key, 날씨, 내일날짜, 지역

                  var r_info = [req.body["user_key"],req.body["content"],users[key].day];
                  console.log(r_info);
                  connection.query("insert into Recent_weather (user_key,location,date_index) value (?,?,?)",r_info,function(err,results){
                      console.log(err);
                      console.log(results);
                  });
               forecast(lo.lat,lo.lng,function(info){
                  console.log(info);
                  messages["message"] = {
                  "text" :
                          '  내일 날씨 : ' +info.sky.name25hour+ ' \n\n'+
                          '  강수확률 : ' +info.percent.prob25hour+'%\n\n'+
                          '  최저기온 : ' +info.temper.tmin2day+' \n'+
                          '  최고기온 : ' +info.temper.tmax2day+' 입니다.'
                  };
                   users[key].count=0;
                  res.send(messages);
               });
            }
         });
      }
      else if (users[key].count ==3 &&users[key].type =='날씨' && users[key].day==3){//세번째질문, 모레
         location(req.body["content"],function(lo){
            console.log(lo);
            if(lo==0){
               messages["message"] = {"text" : '다시입력하세요' };
               res.send(messages);
            }
            else{
               var d = new Date();
               d.setDate(d.getDate()+2);
               var info=[req.body["user_key"],users[key].type,req.body["content"],d];
               console.log(info);
               connection.query("insert into User (user_key,user_content,location,search_date) value (?,?,?,?)",info,function(err,results){
                   console.log(err);
                   console.log(results);
                  });
                  //insert User : user_key, 날씨, 모레날짜, 지역
                  var r_info = [req.body["user_key"],req.body["content"],users[key].day];
                  console.log(r_info);
                  connection.query("insert into Recent_weather (user_key,location,date_index) value (?,?,?)",r_info,function(err,results){
                      console.log(err);
                      console.log(results);
                  });


               forecast(lo.lat,lo.lng,function(info){
                  console.log(info);

                  messages["message"] = {
                  "text" :
                          '  모레 날씨 : ' +info.sky.name49hour+ '\n\n'+
                          '  강수확률 : ' +info.percent.prob25hour+'%\n\n'+
                          '  최저기온 : ' +info.temper.tmin3day+' \n'+
                          '  최고기온 : ' +info.temper.tmax3day+' 입니다.'
                  }
                   users[key].count=0;
                  res.send(messages);
               });
            }
         });
      }
      /////////////////여기까지 날씨

      /////////////////여기부터 생활지수
       if (users[key].count == 1 && req.body["content"] == "생활지수") {
             users[key].type = "생활지수";

             messages["message"] = {"text" : '\t원하는 정보를 선택하세요.\n\n\t1:'+'\t'+'자외선지수\n\t2:'+'\t'+'빨래지수\n\t3:'+'\t'+'미세먼지\n\t4:'+'\t'+'불쾌지수' };
             res.send(messages);
       }

       else if (users[key].count == 2 && users[key].type == "생활지수") {//1:자외선지수, 2:빨래지수, 3:미세먼지, 4:불쾌지수고르는질문
             switch (req.body["content"]) {
             case "1":
             case "2":
             case "3":
             case "4":
                     users[key].info = req.body["content"];
                     break;
             default:
                     messages["message"] = {"text" : '잘못 입력했습니다. 다시 입력해주세요.\n\t1:\t자외선지수\n\t2:\t빨래지수\n\t3:\t미세먼지\n\t4:\t불쾌지수' };
                     users[key].count--;
                     res.send(messages);
                     return;
             }   /*
              * users[key].day
              * users[key].info
              */
             messages["message"] = {"text" : '지역을 입력하세요 !' };
             res.send(messages);

       }

     else if (users[key].count == 3 && users[key].type == "생활지수")//지역입력후
        {

        location(req.body["content"],function(lo){
            console.log(lo);
            if(lo==0){
               messages["message"] = {"text" : '다시입력하세요' };
               res.send(messages);
               users[key].count--;
            }
            else{

                  life(lo.lat,lo.lng,function(life_info){
                     console.log(life_info);
                     console.log(users);
                     //insert Life , 날짜, 지역, 미세먼지, 자외선지수, 빨래지수, 불쾌지수
                     var th_grade = '몰라';
                     if(life_info.th>=80)
                        th_grade = '매우높음';
                     else if(75<=life_info.th&&life_info.th<80)
                        th_grade='높음';
                     else if(65<=life_info.th&&life_info.th<75)
                        th_grade='보통';
                     else if(life_info.th<65)
                        th_grade='낮음';
                     else
                        th_grade = '몰라';


                  var d=new Date();
                     var info=[req.body["user_key"],users[key].type,req.body["content"],d];
                     console.log(info);
                     connection.query("insert into User (user_key,user_content,location,search_date) value (?,?,?,?)",info,function(err,results){
                         console.log(err);
                         console.log(results);
                     });


                     var r_info = [req.body["user_key"],req.body["content"],users[key].info];
                     console.log(r_info);
                     connection.query("insert into Recent_life (user_key,location,life_index) value (?,?,?)",r_info,function(err,results){
                         console.log(err);
                         console.log(results);
                     });


                      switch (users[key].info) {
                      case "1":
                             messages["message"]={"text" :  '자외선지수 : ' +life_info.uv.index+ '\n'+life_info.uv.comment};
                            break;
                         case "2":
                            messages["message"]={"text" :  '빨래지수 : ' +life_info.laundry.index+ '\n'+life_info.laundry.comment};
                            break;
                         case "3":
                             messages["message"]={"text" :  '미세먼지 농도 : ' +life_info.value+ ' 로\n등급 : '+life_info.grade+' 입니다.\n'};
                            break;
                         case "4":
                            messages["message"]={"text" :  '불쾌지수 : '+life_info.th+' 로\n등급 : '+th_grade+'입니다.'};
                            break;
                         default:

                               users[key].count--;
                            return;
                      }
                      users[key].count=0;

                           res.send(messages);

            });
           }
        });

   }


         //////////////////////////////////////여기까지 생활지수

         //////////////////////여기부터 최근기록으로 조회

       if(/*users[key].count==1 &&*/ req.body["content"] == "즐겨찾기"){//첫번째질문, 사용자가 즐겨찾기입력

           users[key].type = "즐겨찾기";
           console.log("즐겨찾기들어옴");

            var recent_user;
            var recent_data;
            var query = "select *from User where user_key=  ? order by request_index desc limit 1";
            connection.query(query,[req.body["user_key"]],function(err,results){
               console.log(err);
                console.log(results);
                if(!results)
                   {
                    messages["message"]={"text" :  "기록에 없습니다"};
                    users[key].count=0;
                    res.send(messages);
                   }
                else{
                   recent_user = results[0];
                   console.log(recent_user);

                   if (recent_user.user_content=="날씨")
                   {
                      var query = "select *from Recent_weather where user_key=  ? order by request_index desc limit 1";
                      connection.query(query,recent_user.user_key,function(err,results){
                      console.log(err);
                      console.log(results);
                      recent_data=results[0];


                      location(recent_data.location,function(lo){
                         console.log(lo);
                         if(lo==0){
                            messages["message"] = {"text" : '다시입력하세요' };
                              users[key].count--;
                            res.send(messages);
                         }

                         else{
                               if(recent_data.date_index==1)
                               {

                                  weather(lo.lat,lo.lng,function(info){
                                  console.log(info);

                                  messages["message"] =
                                     {"text" :
                                        recent_data.location+ '의 날씨 !\n'+

                                             '  현재날씨 : ' +info.sky.name+ '\n\n'+
                                             '  현재기온 : ' +info.temper.tc+' \n'+
                                             '  최저기온 : ' +info.temper.tmin+' \n'+
                                             '  최고기온 : ' +info.temper.tmax+' 입니다.'};
                                  users[key].count=0;
                                  res.send(messages);

                               });

                               }

                               else if(recent_data.date_index==2)
                               {
                                  forecast(lo.lat,lo.lng,function(info){
                                     console.log(info);
                                     messages["message"] = {
                                     "text" :
                                        recent_data.location+ '의 날씨 !\n'+
                                             '  내일 날씨 : ' +info.sky.name25hour+ ' \n\n'+
                                             '  강수확률 : ' +info.percent.prob25hour+'%\n\n'+
                                             '  최저기온 : ' +info.temper.tmin2day+' \n'+
                                             '  최고기온 : ' +info.temper.tmax2day+' 입니다.'
                                     }
                                     users[key].count=0;
                                     res.send(messages);
                                  });

                               }

                               else if(recent_data.date_index==3)
                               {
                                  forecast(lo.lat,lo.lng,function(info){
                                     console.log(info);

                                     messages["message"] = {
                                     "text" :
                                        recent_data.location+ '의 날씨 !\n'+
                                             '  모레 날씨 : ' +info.sky.name49hour+ '\n\n'+
                                             '  강수확률 : ' +info.percent.prob25hour+'%\n\n'+
                                             '  최저기온 : ' +info.temper.tmin3day+' \n'+
                                             '  최고기온 : ' +info.temper.tmax3day+' 입니다.'
                                     }
                                     users[key].count=0;
                                     res.send(messages);
                                  });

                               }

                               }
                         });
                      });
                   }




                   else if (recent_user.user_content=="생활지수")
                   {
                      var query = "select *from Recent_life where user_key=  ? order by request_index desc limit 1";
                       connection.query(query,recent_user.user_key,function(err,results){
                       console.log(err);
                       console.log(results);
                       recent_data=results[0];


                       location(recent_data.location,function(lo){
                          console.log(lo);
                          if(lo==0){
                             messages["message"] = {"text" : '다시입력하세요' };
                               users[key].count--;
                             res.send(messages);
                          }

                          else{

                              life(lo.lat,lo.lng,function(life_info){
                                 console.log(life_info);
                                 console.log(recent_data.life_index);
                                 //insert Life , 날짜, 지역, 미세먼지, 자외선지수, 빨래지수, 불쾌지수
                                 var th_grade = '몰라';
                                 if(life_info.th>=80)
                                    th_grade = '매우높음';
                                 else if(75<=life_info.th&&life_info.th<80)
                                    th_grade='높음';
                                 else if(65<=life_info.th&&life_info.th<75)
                                    th_grade='보통';
                                 else if(life_info.th<65)
                                    th_grade='낮음';
                                 else
                                    th_grade = '몰라';

                                  switch (recent_data.life_index) {
                                  case 1:
                                         messages["message"]={"text" :  recent_data.location+ '의 자외선지수 : ' +life_info.uv.index+ '\n'+life_info.uv.comment};
                                        break;
                                     case 2:
                                        messages["message"]={"text" :  recent_data.location+ '의 빨래지수 : ' +life_info.laundry.index+ '\n'+life_info.laundry.comment};
                                        break;
                                     case 3:
                                         messages["message"]={"text" : recent_data.location+ '의 미세먼지 농도 : ' +life_info.value+ ' 로\n등급 : '+life_info.grade+' 입니다.\n'};
                                        break;
                                     case 4:
                                        messages["message"]={"text" :  recent_data.location+ '의 불쾌지수 : '+life_info.th+' 로\n등급 : '+th_grade+'입니다.'};
                                        break;
                                     default:

                                           users[key].count--;
                                        return;
                                  }
                                  users[key].count=0;

                                       res.send(messages);

                        });

                                }
                          });
                       });


                   }



                }
            });




       }

   });




   // 친구추가
   app.post('/friend', function(req, res){
        var result = {};

      // 요청 param 체크
        if(!req.body["user_key"]){
            result["success"] = 0;
            result["error"] = "invalid request";
            res.json(result);
            return;
        }

      // 파일 입출력
        fs.readFile( __dirname + "/../data/friend.json", 'utf8',  function(err, data){
            var users = JSON.parse(data);
         // 이미 존재하는 친구일 경우
            if(users[req.body["user_key"]]){
                result["success"] = 0;
                result["error"] = "duplicate";
                res.json(result);
                return;
            }
            // 친구추가
            users[req.body["user_key"]] = req.body;
            fs.writeFile(__dirname + "/../data/friend.json",
                         JSON.stringify(users, null, '\t'), "utf8", function(err, data){
                result = 200;
                res.json(result);
                return;
            });
        });

    });

   // 친구삭제(차단)
   app.delete('/friend/:user_key', function(req, res){
        var result = { };

        // 파일 입출력
        fs.readFile(__dirname + "/../data/friend.json", "utf8", function(err, data){
            var users = JSON.parse(data);

            // 존재하지 않는 친구일 경우
            if(!users[req.params.user_key]){
                result["success"] = 0;
                result["error"] = "not found";
                res.json(result);
                return;
            }
         // 친구 삭제
            delete users[req.params.user_key];
            fs.writeFile(__dirname + "/../data/friend.json",
                         JSON.stringify(users, null, '\t'), "utf8", function(err, data){
                result = 200;
                res.json(result);
                return;
            });
        });
    });

   // 채팅방 나가기
   app.delete('/chat_room/:user_key', function(req, res){
      connection.end();

        var result = { };
      result = 200;
      res.json(result);
      return;
    });

};
