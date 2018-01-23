using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebSocketsApp.Models
{
    public class SimpleMessage
    {
        public MessageType Type { get; set; }

        public string Value { get; set; }

        public string UserName { get; set; }

        public string Id { get; set; }
    }

    public enum MessageType
    {
        Send,
        Broadcast,
        Join,
        Leave,
        IJoin,
        IsTyping,
        IsTypingPrivate,
        GroopChat,
        IsTypingGroup
    }
}