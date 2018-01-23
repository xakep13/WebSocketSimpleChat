
$(function (){
    setScreen(false);
    registerEvents();
    var websocket;

    function setScreen(isLogin) {
        if (!isLogin) {

            $("#divChat").hide();
            $("#divLogin").show();
        }
        else {

            $("#divChat").show();
            $("#divLogin").hide();
        }
    }

    function registerEvents() {
        var modal = document.getElementById('myModal');

        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }; 

        $("#btnCreategroup").click(function () {
            modal.style.display = "block";
        });

        $("#btnStartChat").click(function () {
            var name = $("#txtNickName").val();
            var id = Math.floor( Math.random() * (10000 - 2) + 2);
            if (name.length > 0) {
                if (name.length >= 4) {
                    $('#hdId').val(id);
                    $('#hdUserName').val(name);
                    $('#spanUser').html(name);
                    $.cookie('username', name);
                    $.cookie('id', id);
                    registerClientMethods();
                } else {
                    alert("Ім'я має бути довше ніж 3 символи");
                }
            }
            else {
                alert("Please enter name");
            }

        });

        $("#txtNickName").keypress(function (e) {
            if (e.which === 13) {
                $("#btnStartChat").click();
            }
        });

        $("#createGroup").click(function () {
            var values = $('#select').val();


            if (values.length >= 2) {
                values.push($('#hdId').val());
                var str = values.join(' ');
                websocket.send(window.JSON.stringify({ Type: 7, UserName: $('#hdUserName').val(), Value: "Створив групу", Id: str }));
                $("#closer").click();
            }
            else {
                alert("Please select people");
            }

        });

        $("#btnSendMsg").click(function () {
            var msg = $("#txtMessage").val();
            if (msg.length > 0) {
                var userName = $('#hdUserName').val();
                var id = $('#hdId').val();
                websocket.send(window.JSON.stringify({ Type: 1, Value: msg, Id:id }));
                
                $("#txtMessage").val('');
            }
        });

        $("#txtMessage").keypress(function (e) {
            if (e.which === 13) {
                $('#btnSendMsg').click();
            }
            else {
                var Name = $('#hdUserName').val();
                websocket.send(window.JSON.stringify({ Type: 5, UserName: $('#hdUserName').val() }));
            }
        });

        $("#closer").click(function () {
            modal.style.display = "none";
        });  
    }
    
    function registerClientMethods() {
        var url = 'ws://' + 'localhost/WebSocketsApp' + '/ChatHandler.ashx?name=' + $("#txtNickName").val() + '&id=' + $('#hdId').val();

        websocket = new WebSocket(url);

        websocket.onmessage = function (message) {
            var data = window.JSON.parse(message.data);        
            switch (data.Type) {
                case 0:
                    SendPrivateMessage(data.Id, data.UserName, data.Value, false);
                    break;
                case 1:
                    AddMessage(data.UserName, data.Value);
                    break;            
                case 2:   
                    if (data.Id != $('#hdId').val()) {
                        AddUser(data.Id, data.UserName);
                        AddMessage(data.UserName, data.Value);
                    }
                    break;
                case 3:
                    AddMessage(data.UserName, data.Value);
                    RemoveUser(data.Id, data.UserName);
                    break;
                case 4:
                    JoinUser(data.Id);
                    JoimMessage(data.Value);
                    AddMessage(data.UserName, "Приєднався");
                    break;
                case 5:                  
                    SayWhoIsTyping(data.UserName);
                    break;
                case 6:
                    SendPrivateMessage(data.Id, data.UserName, data.Value, true);
                    break;
                case 7:
                    SendGroupMessage(data.Id, data.UserName, data.Value, false);
                    break;
                case 8:
                    SendGroupMessage(data.Id, data.UserName, data.Value, true);
                    break;
            }
        };

        websocket.onopen = function () {
            var name = $("#txtNickName").val();
            var id = $('#hdId').val();
            setScreen(true);       
            websocket.send(window.JSON.stringify({ Type: 2, UserName: name, Id: id }));  
            //AddUser(id, name);
        };

        websocket.onclose = function () {
            websocket.send(window.JSON.stringify({ Type: 3, UserName: $('#hdUserName').val(), Id: $('#hdId').val() }));         
        };

        function JoinUser(allUsers){
            for (i = 0; i < allUsers.length; i++)               
                    AddUser(allUsers[i].ConnectionId, allUsers[i].UserName);         
        }

        function JoimMessage(allMessage) {
            for (i = 0; i < allMessage.length; i++)
                AddMessage(allMessage[i].UserName, allMessage[i].Value);  
        }

        function RemoveUser(id, name) {
            $("#" + id).remove();

            var selectobject = document.getElementById("select")
            for (var i = 0; i < selectobject.length; i++) {
                if (selectobject.options[i].value == id)
                    selectobject.remove(i);
            }

            var ctrId = 'private_' + id;
            $('#' + ctrId).remove();
            var disc = $('<div class="disconnect">"' + name + '" logged off.</div>');
            $(disc).hide();
            $('#divusers').prepend(disc);
            $(disc).fadeIn(200).delay(2000).fadeOut(200);
        }

        function AddUser(id, name) {
            var userId = $('#hdId').val();
            var code = "";
            var code1 = "";

            if (userId == id) {
                code = $('<div class="loginUser">' + name + "</div>");
            }
            else {
                code = $('<a id="' + id + '" class="user" >' + name + '<a>');
                code1 = $('<option value = "' + id + '">' + name + '</option>');
                $(code).dblclick(function () {

                    var id = $(this).attr('id');
                    if (userId != id)
                        OpenPrivateChatWindow(id, name);

                });
            }
            $("#divusers").append(code);
            $("#select").append(code1);
        }

        function AddMessage(userName, message) {
            $('#divChatWindow').append('<div class="message"><span class="userName">' + userName + '</span>: ' + message + '</div>');

            var height = $('#divChatWindow')[0].scrollHeight;
            $('#divChatWindow').scrollTop(height);
        }

        function SendGroupMessage(IwindowId, fromUserName, message, isTyping) {
            windowId = IwindowId.split(' ').join('_');
            //alert(windowId);
            if (!isTyping) {
                var ctrId = 'private_' + windowId;
                if ($('#' + ctrId).length == 0)
                    createGroupChatWindow(windowId, ctrId, fromUserName);

                $('#' + ctrId).find('#divMessage').append('<div class="message"><span class="userName">' + fromUserName + '</span>: ' + message + '</div>');
                var height = $('#' + ctrId).find('#divMessage')[0].scrollHeight;
                $('#' + ctrId).find('#divMessage').scrollTop(height);
            }
            else if (fromUserName != $("#txtNickName").val()) {
                $('#isTypingg').html('<em>' + fromUserName + ' is typing...</em>');
                setTimeout(function () {
                    $('#isTypingg').html('&nbsp;');
                }, 5000);

            }
        }

        function SendPrivateMessage(windowId, fromUserName, message, isTyping) {
            if (!isTyping) {
                var ctrId = 'private_' + windowId;
                if ($('#' + ctrId).length == 0)
                    createPrivateChatWindow(windowId, ctrId, fromUserName);

                $('#' + ctrId).find('#divMessage').append('<div class="message"><span class="userName">' + fromUserName + '</span>: ' + message + '</div>');
                var height = $('#' + ctrId).find('#divMessage')[0].scrollHeight;
                $('#' + ctrId).find('#divMessage').scrollTop(height);
            }
            else {
                $('#isTypingp').html('<em>' + fromUserName + ' is typing...</em>');
                setTimeout(function () {
                    $('#isTypingp').html('&nbsp;');
                }, 5000);
            }        
        }        

        function OpenPrivateChatWindow(id, userName) {
            var ctrId = 'private_' + id;
            if ($('#' + ctrId).length > 0) return;
            createPrivateChatWindow(id, ctrId, userName);
        }

        function createPrivateChatWindow(userId, ctrId, userName) {
            var div = '<div id="' + ctrId + '" class="ui-widget-content draggable" rel="0">' +
                '<div class="header">' +
                '<div  style="float:right;">' +
                '<img id="imgDelete" style="cursor:pointer;" src="/Content/delete.png" />' +
                '</div>' +
                '<span class="selText" rel="0">' + userName + '</span>' +
                '</div>' +
                '<div id="divMessage" class="messageArea">' +             
                '</div>' +
                '<div class="buttonBar">' +
                '<label id="isTypingp" />' +
                '<input id="txtPrivateMessage" class="msgText" type="text"   />' +
                '<input id="btnSendMessage" class="submitButton button" type="button" value="Send"   />' +
                '</div>' +
                '</div>';
            var $div = $(div);

            // DELETE BUTTON IMAGE
            $div.find('#imgDelete').click(function () {
                $('#' + ctrId).remove();
            });

            // Send Button event
            $div.find("#btnSendMessage").click(function () {
                $textBox = $div.find("#txtPrivateMessage");
                var msg = $textBox.val();
                if (msg.length > 0) {
                    websocket.send(window.JSON.stringify({ Type: 0, Value: msg, UserName: $("#txtNickName").val(), Id: userId + ' ' + $('#hdId').val() }));
                    $textBox.val('');
                }
            });

            // Text Box event
            $div.find("#txtPrivateMessage").keypress(function (e) {
                if (e.which === 13) {
                    $div.find("#btnSendMessage").click();
                } else {
                    var Name = $('#hdUserName').val();
                    websocket.send(window.JSON.stringify({ Type: 6, UserName: $('#hdUserName').val(), Id: userId }));
                }
            });
            AddDivToContainer($div);
        }

        function createGroupChatWindow(userId, ctrId, userName) {
            var div = '<div id="' + ctrId + '" class="ui-widget-content draggable" rel="0">' +
                '<div class="header">' +
                '<div  style="float:right;">' +
                '<img id="imgDelete" style="cursor:pointer;" src="/Content/delete.png" />' +
                '</div>' +
                '<span class="selText" rel="0">' + userName + '</span>' +
                '</div>' +
                '<div id="divMessage" class="messageArea">' +
                '</div>' +
                '<div class="buttonBar">' +
                '<label id="isTypingg" />' +
                '<input id="txtGroupMessage" class="msgText" type="text"   />' +
                '<input id="btnSendMessageg" class="submitButton button" type="button" value="Send"   />' +
                '</div>' +
                '</div>';
            var $div = $(div);

            // DELETE BUTTON IMAGE
            $div.find('#imgDelete').click(function () {
                $('#' + ctrId).remove();
            });

            // Send Button event
            $div.find("#btnSendMessageg").click(function () {
                $textBox = $div.find("#txtGroupMessage");
                var msg = $textBox.val();
                if (msg.length > 0) {
                    websocket.send(window.JSON.stringify({ Type: 7, Value: msg, UserName: $('#hdUserName').val(), Id: userId.split("_").join(" ") }));
                    $textBox.val('');
                }
            });

            // Text Box event
            $div.find("#txtGroupMessage").keypress(function (e) {
                if (e.which === 13) {
                    $div.find("#btnSendMessageg").click();
                } else {
                    websocket.send(window.JSON.stringify({ Type: 8, UserName: $('#hdUserName').val(), Id: userId.split("_").join(" ") }));
                }
            });
            AddDivToContainer($div);
        }

        function AddDivToContainer($div) {
            $('#divContainer').prepend($div);

            $div.draggable({
                handle: ".header",
                stop: function () {
                }
            });
        }

        function SayWhoIsTyping(name) {
            if (name != $("#txtNickName").val()) {
                $('#isTyping').html('<em>' + name + ' is typing...</em>');
                setTimeout(function () {
                    $('#isTyping').html('&nbsp;');
                }, 5000);
            }
        }
    }
});