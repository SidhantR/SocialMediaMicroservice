const Search = require("../model/Search")

module.exports = {
    searchPostController : async (req,res) => {
        logger.inf('Search endpoint hit...')
        try {
            const { query} = req.query
            const result = await Search.find(
                {
                    //text operator searches for text in fields that have a text index 
                    $text: {$search: query}
                },
                {
                    score: {$meta: 'textScore'}
                }
            )
            .sort({score: {$meta: 'textScore'}})
            .limit(10)

            res.json(result)
        } catch(err) {
            logger.warn('Error Seraching post')
            res.status(500).json({
                status: false,
                message: 'Error Searching post'
            })
        }
    }
}