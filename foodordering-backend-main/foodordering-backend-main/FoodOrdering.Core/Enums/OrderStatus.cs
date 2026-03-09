using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Core.Enums
{
    public enum OrderStatus
    {
        Pending = 0,
        Accepted = 1,
        Preparing = 2,
        Ready = 3,
        PickedUp = 4,
        OnTheWay = 5,
        Delivered = 6,
        Completed = 7,
        Cancelled = 8,
        Rejected = 9
    }
}
