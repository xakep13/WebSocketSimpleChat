using Microsoft.Web.WebSockets;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using WebSocketsApp.Models;

namespace WebSocketsApp.Controllers
{
    public class MyHandler : WebSocketHandler
    {
        private static WebSocketCollection clients = new WebSocketCollection();

        static List<SimpleMessage> CurrentMessage = new List<SimpleMessage>();
        static List<User> ConnectedUsers = new List<User>();

        private JavaScriptSerializer ser = new JavaScriptSerializer();
        private string name, id;      

        public MyHandler(string id, string name)
        {         
            this.name = name;
            this.id = id;   
        }

        public override void OnOpen()
        {          
            clients.Add(this);
            ConnectedUsers.Add(new User { ConnectionId = this.id, UserName = this.name });

            this.Send(ser.Serialize(new
            {
                Type = MessageType.IJoin,
                UserName = name,
                Value = CurrentMessage,
                Id = ConnectedUsers
            }));   
            
            base.OnOpen();
        }

        public override void OnClose()
        {
            clients.Broadcast(ser.Serialize(new
            {
                Type = MessageType.Leave,
                UserName = name,
                Value = "Покинув бесіду",
                Id = id
            }));

            User user  = ConnectedUsers.FirstOrDefault(n => n.ConnectionId == id);
            clients.Remove(this);
            ConnectedUsers.Remove(user);
            base.Close();
        }

        public override void OnMessage(string message)
        {
            var msg = ser.Deserialize<SimpleMessage>(message);

            switch (msg.Type)
            {
                case MessageType.Broadcast:
                    SendPublicMessage(msg);                
                    break;               
                case MessageType.Join:
                    SendJoinMessage(msg);                 
                    break;
                case MessageType.Send:
                    SendPrivateMessage(msg);
                    break;
                case MessageType.IsTyping:
                    SayWhoIsTyping(msg.UserName);
                    break;
                case MessageType.IsTypingPrivate:
                    SayWhoIsTypingPrivate(msg.UserName, msg.Id);
                    break;
                case MessageType.GroopChat:
                    SendGroupMessage(msg);
                    break;
                case MessageType.IsTypingGroup:
                    SayWhoIsTypingGroup(msg.UserName, msg.Id);
                    break;
            }
        }

        public void SendJoinMessage(SimpleMessage msg)
        {
            clients.Broadcast(ser.Serialize(new
            {
                Type = MessageType.Join,
                UserName = msg.UserName,
                Value = "Приєднався",
                Id = msg.Id
            }));
            //AddMessageinCache(msg.UserName, "Приєднався");
        }

        public void SendPublicMessage(SimpleMessage msg)
        {
            clients.Broadcast(ser.Serialize(new
            {
                Type = msg.Type,
                UserName = name,
                Value = msg.Value,
                Id = msg.Id
            }));
            AddMessageinCache(name, msg.Value);
        }

        public void SendGroupMessage(SimpleMessage msg)
        {
            string[] users = msg.Id.Split(' ');

          
            foreach(string user in users)
            {
                var chanel = clients.FirstOrDefault(n => ((MyHandler)n).id == user);
                if (chanel != null)
                {
                    chanel.Send(ser.Serialize(new
                    {
                        Type = MessageType.GroopChat,
                        UserName = msg.UserName,
                        Value = msg.Value,
                        Id = msg.Id
                    }));
                }
            }
        }

        public void SendPrivateMessage(SimpleMessage msg)
        {
            string[] var1 = Convert.ToString(msg.Id).Split(' ');
            string from = var1[1];
            string to = var1[0];

            var channel = clients.FirstOrDefault(n => ((MyHandler)n).id == to);
            var myChannel = clients.FirstOrDefault(n => ((MyHandler)n).id == from);

            if (channel != null && myChannel != null)
            {
                channel.Send(ser.Serialize(new
                {
                    Type = msg.Type,
                    UserName = msg.UserName,
                    Value = msg.Value,
                    Id = from
                }));
                myChannel.Send(ser.Serialize(new
                {
                    Type = msg.Type,
                    UserName = msg.UserName,
                    Value = msg.Value,
                    Id = to
                }));
            }
        }      

        public void SayWhoIsTypingPrivate(string html, string id)
        {
            var channel = clients.FirstOrDefault(n => ((MyHandler)n).id == id);
            channel.Send(ser.Serialize(new
            {
                Type = MessageType.IsTypingPrivate,
                UserName = html,
                Value = html + " is typing...",
                Id = id
            }));          
        }

        public void SayWhoIsTypingGroup(string html, string id)
        {
            string[] users = id.Split(' ');

            foreach(string user in users)
            {
                var channel = clients.FirstOrDefault(n => ((MyHandler)n).id == user);
                if(channel!=null)
                {
                    channel.Send(ser.Serialize(new
                    {
                        Type = MessageType.IsTypingGroup,
                        UserName = html,
                        Value = html + " is typing...",
                        Id = id
                    }));
                }
            }
        }

        public void SayWhoIsTyping(string html)
        {
            clients.Broadcast(ser.Serialize(new
            {
                Type = MessageType.IsTyping,
                UserName = html,
                Value = html + " is typing..."
            }));
        }

        private void AddMessageinCache(string name, string value)
        {
            CurrentMessage.Add(new SimpleMessage { UserName = name, Value = value });

            if (CurrentMessage.Count > 100)
                CurrentMessage.RemoveAt(0);
        }
    }
}