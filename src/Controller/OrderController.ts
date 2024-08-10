import { Request, Response } from "express";
import Stripe from "stripe";
import restaurantModel,{MenuItemType} from "../Model/restaurant";
import orderModel from "../Model/Order";

const STRIPE = new Stripe(process.env.STRIPE_API_SECRET_KEY as string);
const FRONTEND_URL = process.env.FRONTEND_URL as string;
const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET_KEY as string




type CheckOutSessionRequest = {
  cartItems: {
    menuItemId: string;
    name: string;
    quantity: string;
  }[];
  deliveryDetails: {
    email: string;
    name: string;
    addressLine1: string;
    city: string;
    country: string; 
  };
  restaurantId: string;
};  


const createCheckOutSession = async (req: Request, res: Response) => {
  try {
    const checkOutSessionRequest: CheckOutSessionRequest = req.body;

    const restaurant = await restaurantModel.findById(checkOutSessionRequest.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
        
    const newOrder = new orderModel({
           restaurant : restaurant,
           user : req.userId,
           deliveryDetails : checkOutSessionRequest.deliveryDetails,
           cartItems : checkOutSessionRequest.cartItems,
           status : "placed",
           createdAt : new Date()
    })


    const lineItems = createLineItem(checkOutSessionRequest, restaurant.menuItems);
    const session = await createSession(lineItems, newOrder._id.toString(), restaurant.deliveryPrice, restaurant._id.toString());

    if (!session.url) {
      return res.status(500).json({
        code: 500,
        message: "Error creating stripe session",
      });
    }
        
     await newOrder.save()

    return res.status(200).json({
      code: 200,       
      url: session.url,
    });
  } catch (error: any) {
    console.error("An error occurred:", error.message);
    return res.status(500).json({
      code: 500,
      message: "An error occurred during create checkout session",
      error: error.message,
    });
  }
};


const createLineItem = (checkOutSessionRequest: CheckOutSessionRequest, menuItems: MenuItemType[])=> {
  const lineItems = checkOutSessionRequest.cartItems.map((cartItem) => {
    const menuItem = menuItems.find((item) => item._id.toString() === cartItem.menuItemId.toString());

    if (!menuItem) {
      throw new Error(`Menu Item not found: ${cartItem.menuItemId}`);
    }

    const line_Item: Stripe.Checkout.SessionCreateParams.LineItem = {
      price_data: {
        currency: "gbp",
        unit_amount: menuItem.price,
        product_data: {
          name: menuItem.name,
        },
      },
      quantity: parseInt(cartItem.quantity),
    };
    
    return line_Item;
  });
  
  return lineItems;
};


const createSession = async (
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
  orderId: string,
  deliveryPrice: number,
  restaurantId: string
) => {
  const sessionData = await STRIPE.checkout.sessions.create({
    line_items: lineItems,
    shipping_options: [
      {
        shipping_rate_data: {
          display_name: "Delivery",
          type: "fixed_amount",
          fixed_amount: {
            amount: deliveryPrice,
            currency: "gbp",
          },
        },
      },     
    ],
    mode: "payment",
    metadata: {
      orderId,
      restaurantId,
    },
    success_url: `${FRONTEND_URL}/order-status?success=true`,
    cancel_url: `${FRONTEND_URL}/detail/${restaurantId}?cancelled=true`,
  });
  return sessionData;
};

   




const stripeWebHookHandler = async(req:Request,res:Response) =>
{
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = Stripe.webhooks.constructEvent(req.body,sig as string,STRIPE_ENDPOINT_SECRET)
  } catch (error: any) {
    console.error("An error occurred:", error.message);
    return res.status(500).json({
      code: 500,
      message: "An error occurred during stripe webhook creation",
      error: error.message,
    });
  }
      
      if(event.type === "checkout.session.completed")
      {
        const order = await orderModel.findById(event.data.object.metadata?.orderId)
        if(!order)
        {
          return res.json
          ({
            code : 200,
            message : "Order not found"
          })
        }
           order.totalAmount = event.data.object.amount_total;
           order.status = "paid"

           await order.save();
      }
      return res.json
      ({
        code : 200,
        message : "Order create successfully"
      })
}




// Find Order in any user 

const getMyOrder = async(req:Request,res:Response) => {
       try {
          const findOrder = await orderModel.find({user : req.userId}).populate("restaurant").populate("user")
          if(!findOrder)
          {
            return res.json
            ({
              code : 404,
              message : "User order not found"
            })
          }
          return res.json
          ({
            code : 200,
            order : findOrder,
            message : "User order found successfully"
          })
       } catch (error: any) {
        console.error("An error occurred:", error.message);
        return res.status(500).json({
          code: 500,
          message: "An error occurred during find a order!",
          error: error.message,
        });
      }
}



export default {
  createCheckOutSession,
  stripeWebHookHandler,
  getMyOrder
};