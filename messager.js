import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "courses-api",
  brokers: ["kafka-broker-1-service:9092"],
});

const producer = kafka.producer();

const sendMessageToKafka = async (topic, messages) => {
  try {
    await producer.connect();
    await producer.send({
      topic: "nodejs-courses-api",
      messages: [{ value: topic + ": " + messages }],
    });
  } catch (error) {
    console.error("Error al enviar mensaje a Kafka:", error);
  } finally {
    await producer.disconnect();
  }
};

//sendMessage().catch(console.error);

export default sendMessageToKafka;
