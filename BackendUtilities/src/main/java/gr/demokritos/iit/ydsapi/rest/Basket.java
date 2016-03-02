/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.rest;

import gr.demokritos.iit.ydsapi.model.BasketItem;
import gr.demokritos.iit.ydsapi.model.BasketItem.BasketType;
import gr.demokritos.iit.ydsapi.responses.BaseResponse;
import gr.demokritos.iit.ydsapi.responses.BaseResponse.Status;
import gr.demokritos.iit.ydsapi.responses.BasketItemLoadResponse;
import gr.demokritos.iit.ydsapi.responses.BasketListLoadResponse;
import gr.demokritos.iit.ydsapi.responses.BasketSaveResponse;
import gr.demokritos.iit.ydsapi.storage.MongoAPIImpl;
import gr.demokritos.iit.ydsapi.storage.YDSAPI;
import java.util.List;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
@Path("yds/basket/")
@Produces(MediaType.APPLICATION_JSON)
public class Basket {

    @Path("save")
    @POST
    public Response save(
            String json_basket_item
    ) {
        BasketSaveResponse res = new BasketSaveResponse();
        YDSAPI api = MongoAPIImpl.getInstance();
        try {
            BasketItem item = new BasketItem(json_basket_item);
            String id = api.saveBasketItem(item);
            if (id != null && !id.isEmpty()) {
                res.setStatus(BaseResponse.Status.OK);
                res.setID(id);
            } else {
                res.setStatus(Status.ERROR);
                res.setMessage("Could not save basket item");
                res.setID("");
            }
        } catch (Exception ex) {
            System.out.println(ex.toString()); // error response
            res.setStatus(BaseResponse.Status.ERROR);
            res.setMessage(ex.getMessage() != null
                    ? ex.getMessage()
                    : ex.toString());
        }
        return Response.status(
                res.getStatus() == Status.OK
                        ? Response.Status.OK
                        : Response.Status.INTERNAL_SERVER_ERROR)
                .entity(res.toJSON()).build();
    }

    @Path("get/{user_id}")
    @GET
    public Response load(
            @PathParam("user_id") String user_id,
            @QueryParam("basket_type") String basket_type
    ) {
        YDSAPI api = MongoAPIImpl.getInstance();
        List<BasketItem> baskets;
        BasketListLoadResponse blr;
        try {
            baskets = api.getBasketItems(user_id,
                    basket_type == null
                            ? BasketType.ALL
                            : BasketType.valueOf(basket_type.toUpperCase()));
            blr = new BasketListLoadResponse(baskets);
        } catch (Exception ex) {
            blr = new BasketListLoadResponse(
                    null,
                    Status.ERROR,
                    ex.getMessage() != null ? ex.getMessage() : ex.toString()
            );
        }
        return Response.status(
                blr.getStatus() == Status.OK
                        ? Response.Status.OK
                        : blr.getStatus() == Status.NOT_EXISTS
                                ? Response.Status.NOT_FOUND
                                : Response.Status.INTERNAL_SERVER_ERROR
        ).entity(blr.toJSON()).build();
    }

    @Path("get_item/{basket_item_id}")
    @GET
    public Response getItem(
            @PathParam("basket_item_id") String basket_item_id
    ) {
        YDSAPI api = MongoAPIImpl.getInstance();
        final BasketItem bskt;
        BasketItemLoadResponse blr;
        try {
            bskt = api.getBasketItem(basket_item_id);
            blr = new BasketItemLoadResponse(bskt);
        } catch (Exception ex) {
            blr = new BasketItemLoadResponse(
                    null,
                    Status.ERROR,
                    ex.getMessage() != null ? ex.getMessage() : ex.toString()
            );
        }
        return Response.status(
                blr.getStatus() == Status.OK
                        ? Response.Status.OK
                        : blr.getStatus() == Status.NOT_EXISTS
                                ? Response.Status.NOT_FOUND
                                : Response.Status.INTERNAL_SERVER_ERROR
        ).entity(blr.toJSON()).build();
    }

    @Path("remove/{user_id}")
    @DELETE
    public Response remove(
            @PathParam("user_id") String user_id,
            @QueryParam("basket_item_id") String basket_item_id
    ) {
        YDSAPI api = MongoAPIImpl.getInstance();
        BaseResponse br;
        try {
            if (basket_item_id == null) {
                int res = api.removeBasketItems(user_id);
                br = new BaseResponse(Status.OK, getMessage(res, user_id));
            } else {
                boolean res = api.removeBasketItem(user_id, basket_item_id);
                br = new BaseResponse(Status.OK, getMessage(res, basket_item_id));
            }
        } catch (Exception ex) {
            br = new BaseResponse(
                    Status.ERROR,
                    ex.getMessage() != null ? ex.getMessage() : ex.toString()
            );
        }
        return Response.status(
                br.getStatus() == Status.OK
                        ? Response.Status.OK
                        : br.getStatus() == Status.NOT_EXISTS
                                ? Response.Status.NOT_FOUND
                                : Response.Status.INTERNAL_SERVER_ERROR
        ).entity(br.toJSON()).build();
    }

    private static String getMessage(boolean res, String basket_item_id) {
        return res ? String.format("id: '%s' removed succesfully", basket_item_id) : String.format("id: '%s' not found", basket_item_id);
    }

    private static String getMessage(int res, String user_id) {
        return res > 0
                ? res > 1 ? String.format("removed succesfully %d items", res) : String.format("removed succesfully %d item", res)
                : String.format("no basket items found for user '%s'", user_id);
    }

}
