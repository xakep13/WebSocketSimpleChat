using Microsoft.Owin;
using Microsoft.Web.WebSockets;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.WebSockets;
using WebSocketsApp.Controllers;

namespace WebSocketsApp
{
    public class ChatHandler : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            string id = context.Request.QueryString["id"];
            string name = context.Request.QueryString["name"];

            context.Response.Headers.ToString();
            if (context.IsWebSocketRequest)
                context.AcceptWebSocketRequest(new MyHandler(id,name));          
        }

        public bool IsReusable { get { return false; } }     
    }
}