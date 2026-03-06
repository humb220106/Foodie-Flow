export const restaurants = [
  {
    id: "1",
    name: "La Piazza",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    rating: "4.5",
    status: "OPEN" as const,
    tags: ["Pizza", "Italian", "Pasta"],
    time: "30-40 mins",
    price: "$$",
    delivery: "Free Delivery"
  },
  {
    id: "2",
    name: "Sushi Zen",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
    rating: "4.8",
    status: "OPEN" as const,
    tags: ["Japanese", "Seafood", "Healthy"],
    time: "20-30 mins",
    price: "$$$",
    delivery: "$1.99 Delivery"
  },
  {
    id: "3",
    name: "Big Bite Burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    rating: "4.2",
    status: "CLOSED" as const,
    tags: ["American", "Fast Food", "Wings"],
    time: "15-25 mins",
    price: "$",
    delivery: "Free Delivery"
  },
  {
    id: "4",
    name: "Pasta House",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
    rating: "4.6",
    status: "OPEN" as const,
    tags: ["Italian", "Fine Dining", "Wine"],
    time: "40-50 mins",
    price: "$$$",
    delivery: "Free Delivery"
  }
] as const

export type Restaurant = typeof restaurants[number]