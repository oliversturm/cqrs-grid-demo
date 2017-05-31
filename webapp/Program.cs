using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;

namespace webapp
{
    public class Program
    {
        static void ShowDirectory(string dir) {
            Console.WriteLine("Checking directory " + dir);
            foreach(var file in Directory.EnumerateFiles(dir))
                Console.WriteLine("F: " + file);
            foreach(var sdir in Directory.EnumerateDirectories(dir))
                ShowDirectory(sdir);
        }
        
        public static void Main(string[] args)
        {
            Console.WriteLine("Checking Views");
            ShowDirectory("Views");
            
            var host = new WebHostBuilder()
                .UseKestrel()
                .UseContentRoot(Directory.GetCurrentDirectory())
                .UseIISIntegration()
                .UseStartup<Startup>()
                .UseUrls("http://*:8080")
                .Build();

            host.Run();
        }
    }
}
