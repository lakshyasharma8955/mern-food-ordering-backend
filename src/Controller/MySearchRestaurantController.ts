import { Request, Response} from "express"
import restaurantModel from "../Model/restaurant";

const SearchRestauranByCity = async(req:Request,res:Response) =>
    {
         const city = req.params.city;

         const searchQuery = (req.query.searchQuery as string) || "";
         const selectedCuisions = (req.query.selectedCuisions as string) || ""
         const sortOption = (req.query.sortOption as string) || "createdAt";
         const page = parseInt(req.query.page as string) || 1
         
         const query : any = {};

         query["city"] = new RegExp(city, "i");
 
        const checkCity = await restaurantModel.countDocuments(query);
             if(checkCity === 0)
                {
                     return res.json
                     ({
                        code:404,
                        data : [],
                        
                        message:`No restaurants found in the city of ${city}`,
                        pagination:{
                            total : 0,
                            page : 1,
                            pages : 1
                        }
                     })
                }

              
               if(selectedCuisions)
                {
                    const cuisionsArray = selectedCuisions
                    .split(",")
                    .map((cuisines) => new RegExp(cuisines, "i"))
                     
                  query["cuisines"] = {$all : cuisionsArray}
                }


               

              if(searchQuery)
                {
                    const searchRegex = new RegExp(searchQuery, "i");
                    query["$or"] = [
                        {restaurantName : searchRegex},
                        {cuisines : {$in : [searchRegex]}},
                    ]
                }


                const pageSize = 10;
                const skip = (page - 1) * pageSize;

                const restaurant = await restaurantModel.find(query)
                .sort({[sortOption] : 1})
                .skip(skip)
                .limit(pageSize)
                .lean()

                const total = await restaurantModel.countDocuments(query);

                const response = {
                    data : restaurant,
                    pagination : {
                        total,
                        page,  
                        pages : Math.ceil(total / pageSize)
                    }      
                }   
                    
                 return res.json
                 ({
                    code : 200,
                    message : "Restaurnat Found Successfully",
                    ...response
                 })
    }

      const findRestaurantById = async(req:Request,res:Response) =>
        { 
           try {
            const restaurantId = req.params.restaurantId;
            const restaurant = await restaurantModel.findById(restaurantId);
            if(!restaurant)
                {
                    return res.json
                    ({
                        code:404,
                        message:"Restaurant Id not found"
                    })
                }
                return res.json
                ({
                    code:200,
                    restaurant:restaurant
                })
           } catch (error:any) {
            console.error("An error occurred:", error.message);
            return res.json
            ({
              code: 500,
              message: "An error occurred during restaurant By Id",
              error: error.message,
            })
          }
        }

    export default
    {
        SearchRestauranByCity,
        findRestaurantById
    }

