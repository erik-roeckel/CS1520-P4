from flask import Flask, render_template
from flask_restful import reqparse, abort, Resource, Api

app = Flask(__name__)
api = Api(app)

app.config.update(dict(SEND_FILE_MAX_AGE_DEFAULT=0))

CATEGORIES = {}
PURCHASES = {}

def abort_if_cat_doesnt_exist(cat_id):
    if cat_id not in CATEGORIES:
        abort(404, message="Category {} doesn't exist".format(cat_id))

def abort_if_purchase_doesnt_exist(purchase_id):
    if purchase_id not in PURCHASES:
        abort(404, message="Purchase {} doesn't exist".format(purchase_id))

parser = reqparse.RequestParser()
parser.add_argument('name')
parser.add_argument('limit')
parser.add_argument('purchases')
parser.add_argument('pName')
parser.add_argument('pAmount')
parser.add_argument('pDate')
parser.add_argument('pCat')

@app.route("/")
def root_page():
    return render_template("layout.html")

class Category(Resource):
    def get(self, cat_id):
        abort_if_cat_doesnt_exist(cat_id)
        return CATEGORIES[cat_id]
    def delete(self, cat_id):
        abort_if_cat_doesnt_exist(cat_id)
        del CATEGORIES[cat_id]
        return '', 204
    def put(self, cat_id):
        args = parser.parse_args()
        category = {'name': args['name'], 'limit': args['limit'], 'purchases': args['purchases']}
        CATEGORIES[cat_id] = category
        return category, 201


class CategoryList(Resource):
    def get(self):
        return CATEGORIES

    def post(self):
        args = parser.parse_args()
        if CATEGORIES:
            cat_id = int(max(CATEGORIES.keys())) + 1
        else:
            cat_id = 1
        cat_id = str(cat_id)
        CATEGORIES[cat_id] = {'name': args['name'], 'limit': args['limit'], 'purchases': args['purchases']}
        return CATEGORIES[cat_id], 201

class Purchase(Resource):
    def get(self, purchase_id):
        abort_if_purchase_doesnt_exist(purchase_id)
        return PURCHASES[purchase_id]
    
    def put(self, purchase_id):
        args = parser.parse_args()
        purchase = {'pName': args['pName'], 'pAmount': args['pAmount'], 'pDate': args['pDate'], 'pCat': args['pCat']}
        PURCHASES[purchase_id] = purchase
        return purchase, 201

class PurchaseList(Resource):
    def get(self):
        return PURCHASES

    def post(self):
        args = parser.parse_args()
        if PURCHASES:
            purchase_id = int(max(PURCHASES.keys())) + 1
        else:
            purchase_id = 1
        purchase_id = str(purchase_id)
        PURCHASES[purchase_id] = {'pName': args['pName'], 'pAmount': args['pAmount'], 'pDate': args['pDate'], 'pCat': args['pCat']}
        return PURCHASES[purchase_id], 201


api.add_resource(CategoryList, '/cats')
api.add_resource(Category, '/cats/<cat_id>')
api.add_resource(PurchaseList, '/purchases')
api.add_resource(Purchase, '/purchases/<purchase_id>')

if __name__ == '__main__':
	app.run(debug=True)