//base - Product.find()
//bigQ - search=coder&page=2&category=shorts&rating[gte]=4&price[lte]=999&price[gte]=500&limit=5

class WhereClause{
  constructor(base, bigQ){
    this.base = base
    this.bigQ = bigQ
  }

  search(){
    const searchWord = this.bigQ.search ? {
      name: {
        $regex: this.bigQ.search,
        $options: 'i'                //case insensitive
      }
    } : {}
    this.base = this.base.find({...searchWord})
    return this
  }

  pager(resultPerPage){
    let currentPage = 1

    if(this.bigQ.page){
      currentPage = this.bigQ.page
    }

    const skipVal = resultPerPage * (currentPage-1)
    this.base = this.base.limit(resultPerPage).skip(skipVal)
    return this
  }

  filter(){
    const copyQ = {...this.bigQ}

    delete copyQ["search"]
    delete copyQ["limit"]
    delete copyQ["page"]
  
    console.log(copyQ)
    let stringOfCopy = JSON.stringify(copyQ)
    stringOfCopy = stringOfCopy.replace(/\b(gte|lte|gt|lt)\b/g, m => `$${m}`)
    const jsonOfCopyQ = JSON.parse(stringOfCopy) 
    //console.log(typeof jsonOfCopyQ.price['$lte'])
    this.base = this.base.find(jsonOfCopyQ)
    return this
  }
}

export default WhereClause