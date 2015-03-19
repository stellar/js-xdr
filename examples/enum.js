import { Enum } from "xdr";

let Color = Enum.create('Color', {
  red: 0,
  green: 1,
  blue: 2,
});


let ResultType = Enum.create('ResultType', {
  ok: 0,
  error: 1
});

Color.members(); // { red: 0, green: 1, blue: 2, }

Color.fromName("red");
Color.fromName("RED");

Color.fromXDR(new Buffer([0,0,0,0])); // Color.red
Color.red().toXDR(); // Buffer
Color.red().toXDR("hex"); //



console.log( Color.red() !== ResultType.ok() );