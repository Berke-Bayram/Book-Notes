# Book Notes Web App

This is a web application for book reviews.

## Features

- User authentication: Users can create accounts, log in, and log out.
- Book reviews: Users can create, read, edit, and delete their own reviews for various books.
- Sorting: Users can sort reviews by date, rating, and title.
- Open Library Covers API: This project uses the Open Library Covers API to display book covers. 
- API Link: https://openlibrary.org/dev/docs/api/covers
- PostgreSQL Database: This project uses PostgreSQL for data storage.

## Functionality

- Creating reviews: Users can create a new book review by providing the title, author, category, notes, rating, and Open Library ID (OLID) of the book.
- Editing and deleting reviews: Users can edit or delete their own reviews.
- Creating accounts: Users can create a new account by providing a username and password.
- Sorting reviews: Users can sort all reviews by date, rating, or title. They can also view only their own reviews.

## Database Schema

The application uses two tables: `users` and `books`.

- `users` table:
  - `id`: Primary key, auto-increment.
  - `username`: String, unique.
  - `password`: String, hashed and salted.

- `books` table:
  - `id`: Primary key, auto-increment.
  - `title`: String.
  - `author`: String.
  - `keywords`: Array of strings.
  - `category`: String.
  - `description`: String.
  - `entry_date`: Date.
  - `rating`: Integer.
  - `img_url`: String.
  - `olid`: String.
  - `user_`: Foreign key referencing `users.username`.

## Usage

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Start the server with `npm start`.
4. Navigate to `localhost:3000` in your web browser.
5. (Note that you need to create a PostgreSQL database for the functionality. You can use the given database schema.)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
