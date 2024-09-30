class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // simple
    const queryObj = { ...this.queryString };
    const excludedQuery = ['page', 'sort', 'limit', 'fields'];
    excludedQuery.forEach((el) => delete queryObj[el]);

    // advance.
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // gte to $gte
    // console.log(JSON.parse(queryStr));

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      console.log(this.queryString.sort);

      const sortBy = this.queryString.sort.split(',').join(' ');
      // console.log(sortBy); // req.query.sort === ( 'price ratingsAverage').

      this.query = this.query.sort(sortBy); // ===  sort(-price -ratingsAverage)
    } else {
      this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const field = this.queryString.fields.split(',').join(' ');
      console.log(field);
      this.query = this.query.select(field);
    } else {
      this.query = this.query.select('-__v'); // (-) to remove this field.
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = ApiFeatures;
