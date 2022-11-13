import Realm from "realm";

export class NoteSchema extends Realm.Object<NoteSchema, "content"> {
  // @ts-ignore
  static name = "MyNote"
  static primaryKey = "_id"

  _id = new Realm.BSON.ObjectId()
  createdAt = new Date()
  content!: string
}
