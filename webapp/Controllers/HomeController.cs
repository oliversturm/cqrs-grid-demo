using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace webapp.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Error()
        {
            return View();
        }

        public IActionResult DataGrid() {
            return View();
        }

        public IActionResult PivotGrid() {
            return View();
        }
    }
}
